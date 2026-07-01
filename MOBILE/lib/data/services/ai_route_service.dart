import 'dart:convert';

import 'package:geolocator/geolocator.dart';

import '../../core/constants/api_constants.dart';
import '../models/itinerary_model.dart';
import '../models/place_model.dart';
import 'api_client.dart';
import 'auth_service.dart';
import 'itinerary_service.dart';
import 'profile_service.dart';

// ─────────────────────────────────────────────────────────────────────────────

class AiRouteResult {
  final Itinerary itinerary;
  final List<Map<String, dynamic>> recommendations;
  final OptimizeResult optimize;

  const AiRouteResult({
    required this.itinerary,
    required this.recommendations,
    required this.optimize,
  });
}

typedef ProgressCallback = void Function(String step);

// ─────────────────────────────────────────────────────────────────────────────

class AiRouteConfig {
  final DateTime? startDate;
  final int nDays;
  final int nPersonas;
  final String groupType;
  final List<String> tourTypes;
  final String budget;
  final int stopsPerDay;
  final String? city;
  final CityData? cityData;

  const AiRouteConfig({
    this.startDate,
    this.nDays = 1,
    this.nPersonas = 1,
    this.groupType = 'solo',
    this.tourTypes = const [],
    this.budget = 'medio',
    this.stopsPerDay = 3,
    this.city,
    this.cityData,
  });

  int get totalStops => nDays * stopsPerDay;
}

// ─────────────────────────────────────────────────────────────────────────────

class AiRouteService {
  static const _outdoorKeywords = {
    'montaña', 'bosque', 'campo', 'naturaleza', 'desierto', 'senderismo', 'playa',
  };

  // ── Public entry point ───────────────────────────────────────────────────

  Future<AiRouteResult> generateRoute({
    required AiRouteConfig config,
    ProgressCallback? onProgress,
  }) async {
    final svc = ItineraryService();

    // 1. User session
    onProgress?.call('Verificando sesión...');
    final userId = await AuthService().getUserId();
    if (userId == null) throw AiRouteException('Sesión expirada. Inicia sesión de nuevo.');

    // 2. Profile (for contextual signals like accessibility, preferred place)
    onProgress?.call('Analizando tus preferencias...');
    final profile = await ProfileService.fetchMyProfileForPreferences();

    // 3. Location (optional — never blocks)
    final pos = await _getLocation();

    // 4. ML recommendations
    onProgress?.call('Consultando el motor de IA...');
    final recs = await _fetchRecommendations(
      userId: userId,
      config: config,
      profile: profile,
      pos: pos,
    );
    if (recs.isEmpty) {
      throw AiRouteException(
          'El motor de IA no encontró lugares para tu selección. '
          'Prueba con diferentes tipos de turismo o presupuesto.');
    }

    // 5. Create itinerary
    onProgress?.call('Creando tu itinerario...');
    final title = _buildTitle(config);
    final itinerary = await svc.createItinerary(title: title);

    // 6. Update itinerary with dates
    if (config.startDate != null) {
      await svc.updateItinerary(
        itinerary.id,
        startDate: config.startDate,
        endDate: config.nDays > 1
            ? config.startDate!.add(Duration(days: config.nDays - 1))
            : config.startDate,
      );
    }

    // 7. Add stops with visit dates distributed across days
    for (var i = 0; i < recs.length; i++) {
      final rec = recs[i];
      final parsed = _parseItemId(rec['item_id']?.toString() ?? '');
      if (parsed == null) continue;
      final tags = (rec['reason_tags'] as List?)?.map((t) => t.toString()).join(' · ');
      final dayOffset = config.nDays > 1 ? (i / config.stopsPerDay).floor() : 0;
      final visitDate = config.startDate?.add(Duration(days: dayOffset));
      await svc.addStop(
        itinerary.id,
        placeKind: parsed.$1,
        placeId: parsed.$2,
        visitDate: visitDate,
        notes: tags,
      );
    }

    // 8. Optimize with ACO
    onProgress?.call('Optimizando el recorrido con IA...');
    final OptimizeResult optimize;
    try {
      optimize = await svc.optimizeItinerary(itinerary.id);
      await svc.reorderStops(itinerary.id, optimize.optimizedStopIds);
    } on ItineraryException {
      final placeholder = OptimizeResult(
        optimizedStopIds: const [],
        originalDistanceKm: 0,
        optimizedDistanceKm: 0,
        savingsPct: 0,
      );
      final final_ = await svc.fetchById(itinerary.id) ?? itinerary;
      return AiRouteResult(
          itinerary: final_, recommendations: recs, optimize: placeholder);
    }

    // 9. Fetch final result with updated stop order
    final finalItinerary = await svc.fetchById(itinerary.id) ?? itinerary;

    return AiRouteResult(
      itinerary: finalItinerary,
      recommendations: recs,
      optimize: optimize,
    );
  }

  // ── ML call ──────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> _fetchRecommendations({
    required int userId,
    required AiRouteConfig config,
    required Map<String, dynamic> profile,
    Position? pos,
  }) async {
    final isOutdoor = profile['preferred_place'] != null &&
        _outdoorKeywords.any((kw) =>
            profile['preferred_place'].toString().toLowerCase().contains(kw));

    final hasAccessibility = profile['has_accessibility'] == true;

    final ageRange = _ageRangeFrom(profile['age'] as int?);

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.mlRecommend}/$userId');
    final payload = {
      'alpha': 0.35,
      'top_n': config.totalStops,
      'context': {
        // Core trip parameters
        'n_dias': config.nDays,
        'n_personas': config.nPersonas,
        if (config.startDate != null)
          'fecha_inicio': config.startDate!.toIso8601String().split('T')[0],

        // Preferences
        'presupuesto_bucket': config.budget,
        'tiposTurismo': config.tourTypes.isNotEmpty
            ? config.tourTypes
            : _deriveTypesFromProfile(profile),
        'group_type': config.groupType,
        'edad_range': ageRange,

        // Derived from profile
        'requiere_accesibilidad': hasAccessibility,
        'pref_outdoor': isOutdoor || config.tourTypes.contains('naturaleza'),
        'pref_food': config.tourTypes.contains('gastronomico'),
        'wants_tours': false,
        'needs_hotel': config.nDays > 1,

        // Location context
        if (pos != null) 'lat': pos.latitude,
        if (pos != null) 'lon': pos.longitude,
        if (config.city != null) 'ciudad': config.city,
      },
    };

    final res = await ApiClient.post(url, body: jsonEncode(payload));
    if (res.statusCode == 401) throw AiRouteException('Sesión expirada.');
    if (res.statusCode != 200) {
      final msg = ApiClient.extractApiMessage(res,
          fallback: 'Error del motor de IA (${res.statusCode})');
      throw AiRouteException(msg);
    }

    final data = jsonDecode(utf8.decode(res.bodyBytes));
    final list = data is List
        ? data
        : (data['recommendations'] as List? ?? []);

    var results = list.whereType<Map<String, dynamic>>().toList();

    // Client-side filter: keep only places that belong to the selected city
    if (config.cityData != null) {
      final validIds = config.cityData!.places.map((p) => p.id).toSet();
      results = results.where((r) {
        final itemId = r['item_id']?.toString() ?? '';
        return validIds.contains(itemId);
      }).toList();
    }

    return results;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  (String, int)? _parseItemId(String raw) {
    final parts = raw.split('_');
    if (parts.length < 2) return null;
    final id = int.tryParse(parts.last);
    if (id == null) return null;
    final kind = parts.sublist(0, parts.length - 1).join('_');
    return (kind, id);
  }

  String _buildTitle(AiRouteConfig cfg) {
    final types = cfg.tourTypes.take(2).join(' & ');
    final prefix = cfg.nDays == 1
        ? 'Ruta del día'
        : cfg.nDays <= 2
            ? 'Fin de semana'
            : '${cfg.nDays} días';
    final date = cfg.startDate != null
        ? ' · ${_shortDate(cfg.startDate!)}'
        : '';
    return types.isNotEmpty ? '$prefix · $types$date' : '$prefix IA$date';
  }

  String _shortDate(DateTime d) =>
      '${d.day}/${d.month}/${d.year}';

  String _ageRangeFrom(int? age) {
    if (age == null || age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }

  List<String> _deriveTypesFromProfile(Map<String, dynamic> profile) {
    final interests = (profile['interests'] as List?)?.map((e) => e.toString()) ?? [];
    return interests
        .map(_mapInterestToTipo)
        .whereType<String>()
        .toSet()
        .toList();
  }

  String? _mapInterestToTipo(String raw) {
    final v = raw.toLowerCase().trim();
    const direct = {
      'cultural', 'naturaleza', 'gastronomico', 'aventura', 'descanso', 'nocturno',
    };
    if (direct.contains(v)) return v;
    if (v.contains('cultur') || v.contains('histor') || v.contains('arte') || v.contains('museo')) return 'cultural';
    if (v.contains('natur') || v.contains('eco') || v.contains('montaña') || v.contains('bosque')) return 'naturaleza';
    if (v.contains('gastro') || v.contains('food') || v.contains('restaur')) return 'gastronomico';
    if (v.contains('avent') || v.contains('hik') || v.contains('deporte')) return 'aventura';
    if (v.contains('descans') || v.contains('relax') || v.contains('spa') || v.contains('bienestar')) return 'descanso';
    if (v.contains('nocturn') || v.contains('night') || v.contains('fiesta')) return 'nocturno';
    return null;
  }

  Future<Position?> _getLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) return null;
      }
      if (perm == LocationPermission.deniedForever) return null;
      return await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.low,
              timeLimit: Duration(seconds: 4),
            ),
          );
    } catch (_) {
      return null;
    }
  }
}

class AiRouteException implements Exception {
  final String message;
  const AiRouteException(this.message);
  @override
  String toString() => message;
}

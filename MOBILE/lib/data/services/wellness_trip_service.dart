import 'dart:convert';

import '../../core/constants/api_constants.dart';
import 'api_client.dart';

class WellnessTripDestination {
  final String id;
  final String name;
  final String state;
  final String category;
  final double matchPct;
  final int rank;
  final List<String> matchedMotives;
  final List<String> matchedModalities;
  final Map<String, String> evidence;
  final String description;
  final String? imageUrl;
  final double? lat;
  final double? lon;

  const WellnessTripDestination({
    required this.id,
    required this.name,
    required this.state,
    required this.category,
    required this.matchPct,
    required this.rank,
    required this.matchedMotives,
    required this.matchedModalities,
    required this.evidence,
    required this.description,
    this.imageUrl,
    this.lat,
    this.lon,
  });

  factory WellnessTripDestination.fromJson(Map<String, dynamic> json) {
    final evidenceJson = json['match_evidence'] is Map<String, dynamic>
        ? json['match_evidence'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return WellnessTripDestination(
      id: json['id_destino'] as String? ?? '',
      name: json['nombre_lugar'] as String? ?? '',
      state: json['estado'] as String? ?? '',
      category: json['categoria_wellness'] as String? ?? '',
      matchPct: (json['match_pct'] as num?)?.toDouble() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      matchedMotives: (json['matched_M'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      matchedModalities: (json['matched_W'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      evidence: evidenceJson.map(
        (key, value) => MapEntry(key, value.toString()),
      ),
      description: json['descripcion_bienestar'] as String? ?? '',
      imageUrl: json['image_url'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lon: (json['lon'] as num?)?.toDouble(),
    );
  }

  String? get detailPagePlaceId {
    final separator = id.indexOf(':');
    if (separator < 1 || separator == id.length - 1) return null;
    final kind = id.substring(0, separator);
    final itemId = id.substring(separator + 1);
    if (kind == 'poi') return 'poi_$itemId';
    if (kind == 'service') return 'svc_$itemId';
    return null;
  }
}

class WellnessTripResult {
  final String algorithm;
  final String mlStatus;
  final String notice;
  final List<WellnessTripDestination> destinations;
  final int? sessionId;

  const WellnessTripResult({
    required this.algorithm,
    required this.mlStatus,
    required this.notice,
    required this.destinations,
    this.sessionId,
  });

  factory WellnessTripResult.fromJson(Map<String, dynamic> json) =>
      WellnessTripResult(
        algorithm: json['algorithm'] as String? ?? 'unknown',
        mlStatus: json['ml_status'] as String? ?? 'unknown',
        notice: json['notice'] as String? ?? '',
        destinations: (json['destinations'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(WellnessTripDestination.fromJson)
            .toList(),
        sessionId: (json['session_id'] as num?)?.toInt(),
      );
}

class WellnessTripService {
  Uri _uri(String path) => Uri.parse('${ApiConstants.baseUrl}$path');

  Future<WellnessTripResult> recommend({
    required List<String> motivePriorities,
    required List<String> modalityPreferences,
    required int maxEffort,
    required bool needsAccessible,
    required bool saveHistory,
    String? regionFilter,
    int topN = 5,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/recommend-mw'),
      body: jsonEncode({
        'preferences': {
          'motive_priorities': motivePriorities,
          'modality_preferences': modalityPreferences,
          'max_effort': maxEffort,
          'needs_accessible': needsAccessible,
          if (regionFilter case final String region when region.isNotEmpty)
            'region_filter': region,
        },
        'top_n': topN,
        'consent_given': saveHistory,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception(
        'Error en recomendaciones WELLTUR: ${response.statusCode}',
      );
    }
    return WellnessTripResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> submitItemFeedback({
    required int sessionId,
    required String itemId,
    required String eventType,
    int? rating,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/item-feedback'),
      body: jsonEncode({
        'session_id': sessionId,
        'item_id': itemId,
        'event_type': eventType,
        'rating': ?rating,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('No se pudo guardar la respuesta sobre el lugar.');
    }
  }
}

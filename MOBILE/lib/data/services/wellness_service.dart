import 'dart:convert';
import '../../core/constants/api_constants.dart';
import 'api_client.dart';

// El API puede mandar números como texto (p. ej. columnas NUMERIC de PostgreSQL).
// Leer con tolerancia evita que un solo campo tumbe toda la recomendación.
double? _aDouble(Object? v) => v is num ? v.toDouble() : (v is String ? double.tryParse(v) : null);
String? _aTexto(Object? v) => v?.toString();
bool? _aBool(Object? v) => v is bool ? v : (v is String ? v == 'true' : (v is num ? v != 0 : null));

/// Lugar ordenado por coincidencia con preferencias explícitas de viaje.
class WellnessDestination {
  final String idDestino;
  final String nombreLugar;
  final String estado;
  final String categoriaWellness;
  final double matchPct;
  final int rank;
  final List<String> wellnessDimensions;
  final String? imageUrl;
  final double? lat;
  final double? lon;
  final String descripcionBienestar;
  final String municipio;
  final String explicacion;
  final bool esMipyme;

  /// "alta": cumple lo que pediste; "media": no es de tus modalidades; "baja": se relajó un filtro.
  final String coincidencia;
  final String? motivoCoincidencia;

  /// Modalidades W1-W7 revisadas del lugar (las que explican por qué se recomienda).
  final List<String> modalidades;

  /// Revisado por una persona (inventario nacional, verificado en campo, o ficha del DENUE
  /// reclamada por su empresa y aprobada). Los del DENUE son propuestas por regla.
  final bool verificado;

  /// Canonical reference consumed by DetailViewPage and existing place tracking.
  String? get detailPagePlaceId {
    final separator = idDestino.indexOf(':');
    if (separator < 1 || separator == idDestino.length - 1) return null;
    final kind = idDestino.substring(0, separator);
    final id = idDestino.substring(separator + 1);
    if (kind == 'poi') return 'poi_$id';
    if (kind == 'service') return 'svc_$id';
    return null;
  }

  const WellnessDestination({
    required this.idDestino,
    required this.nombreLugar,
    required this.estado,
    required this.categoriaWellness,
    required this.matchPct,
    required this.rank,
    this.wellnessDimensions = const [],
    this.imageUrl,
    this.lat,
    this.lon,
    required this.descripcionBienestar,
    this.municipio = '',
    this.explicacion = '',
    this.esMipyme = false,
    this.coincidencia = 'alta',
    this.motivoCoincidencia,
    this.modalidades = const [],
    this.verificado = false,
  });

  factory WellnessDestination.fromJson(Map<String, dynamic> j) {
    return WellnessDestination(
      idDestino:              _aTexto(j['id_destino']) ?? '',
      nombreLugar:            _aTexto(j['nombre_lugar']) ?? '',
      estado:                 _aTexto(j['estado']) ?? '',
      categoriaWellness:      _aTexto(j['categoria_wellness']) ?? '',
      matchPct:               _aDouble(j['match_pct']) ?? 0,
      rank:                   _aDouble(j['rank'])?.toInt() ?? 0,
      wellnessDimensions:     ((j['wellness_dimensions'] as List<dynamic>?) ?? const []).whereType<String>().toList(),
      imageUrl:               _aTexto(j['image_url']),
      lat:                    _aDouble(j['lat']),
      lon:                    _aDouble(j['lon']),
      descripcionBienestar:   _aTexto(j['descripcion_bienestar']) ?? '',
      municipio:              _aTexto(j['municipio']) ?? '',
      explicacion:            _aTexto(j['explicacion']) ?? '',
      esMipyme:               _aBool(j['es_mipyme']) ?? false,
      coincidencia:           _aTexto(j['coincidencia']) ?? 'alta',
      motivoCoincidencia:     _aTexto(j['motivo_coincidencia']),
      modalidades:            ((j['place_modalities'] as List<dynamic>?) ?? const []).whereType<String>().toList(),
      verificado:             _aBool(j['verificado']) ?? false,
    );
  }
}

/// Resultado de ordenar el catálogo según preferencias de viaje.
class WellnessRecommendationResult {
  final String title;
  final String description;
  final List<WellnessDestination> destinations;
  final int? sessionId;

  /// Presente cuando se incluyeron lugares con menor relación con tus respuestas.
  final String? avisoCoincidencia;

  const WellnessRecommendationResult({
    required this.title,
    required this.description,
    required this.destinations,
    this.sessionId,
    this.avisoCoincidencia,
  });

  factory WellnessRecommendationResult.fromJson(Map<String, dynamic> j) {
    return WellnessRecommendationResult(
      title:                _aTexto(j['modo_viaje_label']) ?? 'Lugares para ti',
      description:          _aTexto(j['modo_viaje_description']) ?? '',
      destinations: ((j['destinations'] as List<dynamic>?) ?? [])
          .map((d) => WellnessDestination.fromJson(d as Map<String, dynamic>))
          .toList(),
      sessionId:    _aDouble(j['session_id'])?.toInt(),
      avisoCoincidencia: _aTexto(j['aviso_coincidencia']),
    );
  }
}

class WellnessService {
  Uri _uri(String path) => Uri.parse('${ApiConstants.baseUrl}$path');

  /// Envía preferencias explícitas de viaje; no solicita ni infiere estrés.
  Future<WellnessRecommendationResult> recommend({
    required List<String> wellnessDimensions,
    required String activityLevel,
    required bool saveHistory,
    String? regionFilter,
    int topN = 3,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/recommend'),
      body: jsonEncode({
        'preferences': {
          'wellness_dimensions': wellnessDimensions,
          'activity_level': activityLevel,
          if (regionFilter != null && regionFilter.isNotEmpty) 'region_filter': regionFilter,
        },
        'top_n': topN,
        'consent_given': saveHistory,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Error en recomendación wellness: ${response.statusCode}');
    }
    return WellnessRecommendationResult.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  /// WELLTUR: un solo formulario. PSS-10 (opcional), motivos M, modalidades W, esfuerzo y
  /// zona (`altas_montanas` o `mexico`) se ponderan juntos; no es un diagnóstico.
  Future<WellnessRecommendationResult> recommendV2({
    Map<String, int>? stressItems,
    List<int?>? pssItems,
    List<String> motives = const [],
    double? pss10TotalGuardado,
    required List<String> modalities,
    required int maxEffort,
    required bool saveHistory,
    String scope = 'altas_montanas',
    String? regionFilter,
    int topN = 5,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/recommend-v2'),
      body: jsonEncode({
        'preferences': {
          'motive_priorities': motives,
          'modality_preferences': modalities,
          'max_effort': maxEffort,
          'scope': scope,
          if (regionFilter != null && regionFilter.isNotEmpty) 'region_filter': regionFilter,
          if (pssItems == null && pss10TotalGuardado != null) 'pss10_total': pss10TotalGuardado,
        },
        'pss_items': ?pssItems,
        if (pssItems == null && stressItems != null) 'stress_items': stressItems,
        'top_n': topN,
        'consent_given': saveHistory,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Error en recomendación WELLTUR: ${response.statusCode}');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return WellnessRecommendationResult.fromJson({
      ...data,
      'modo_viaje_label': 'Lugares para tu viaje',
      'modo_viaje_description': data['notice'] ?? '',
    });
  }

  /// Evento de un lugar mostrado: 'opened' (vio el detalle) o 'selected' (pidió cómo llegar).
  /// Solo existe la sesión si la persona aceptó guardar su búsqueda; si falla, no interrumpe.
  Future<void> itemFeedback({required int sessionId, required String itemId, required String evento}) async {
    try {
      await ApiClient.post(
        _uri('/ml/wellness/item-feedback'),
        body: jsonEncode({'session_id': sessionId, 'item_id': itemId, 'event_type': evento}),
      );
    } catch (_) {}
  }

  /// PSS-10 ya contestada por esta persona (licencia: una sola aplicación por persona).
  Future<({double total, DateTime? fecha})?> pss10Previa() async {
    try {
      final r = await ApiClient.get(_uri('/ml/wellness/pss10/me'));
      if (r.statusCode != 200) return null;
      final j = jsonDecode(r.body) as Map<String, dynamic>;
      if (j['respondida'] != true) return null;
      final total = _aDouble(j['pss10_total']);
      if (total == null) return null;
      return (total: total, fecha: DateTime.tryParse(_aTexto(j['fecha']) ?? ''));
    } catch (_) {
      return null;
    }
  }

  /// Registra satisfacción 1-5 post-recomendación.
  Future<void> submitSatisfaction({
    required int sessionId,
    required int fitRating,
    String? feedbackText,
  }) async {
    await ApiClient.post(
      _uri('/ml/wellness/satisfaction'),
      body: jsonEncode({
        'session_id': sessionId,
        'fit_rating': fitRating,
        if (feedbackText case final String text) 'feedback_text': text,
      }),
    );
  }

  /// Obtiene el historial de preferencias y recomendaciones de bienestar.
  Future<List<Map<String, dynamic>>> getHistory() async {
    final response = await ApiClient.get(_uri('/ml/wellness/history/me'));
    if (response.statusCode != 200) return [];
    final data = jsonDecode(response.body) as List<dynamic>;
    return data.cast<Map<String, dynamic>>();
  }

  /// Borra historial de bienestar (LFPDPPP — derecho al olvido).
  Future<bool> deleteHistory() async {
    final response = await ApiClient.delete(_uri('/ml/wellness/history/me'));
    return response.statusCode == 200;
  }
}

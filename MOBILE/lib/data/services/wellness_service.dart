import 'dart:convert';
import '../../core/constants/api_constants.dart';
import 'api_client.dart';

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
  });

  factory WellnessDestination.fromJson(Map<String, dynamic> j) {
    return WellnessDestination(
      idDestino:              j['id_destino'] as String? ?? '',
      nombreLugar:            j['nombre_lugar'] as String? ?? '',
      estado:                 j['estado'] as String? ?? '',
      categoriaWellness:      j['categoria_wellness'] as String? ?? '',
      matchPct:               (j['match_pct'] as num?)?.toDouble() ?? 0,
      rank:                   (j['rank'] as num?)?.toInt() ?? 0,
      wellnessDimensions:     ((j['wellness_dimensions'] as List<dynamic>?) ?? const []).whereType<String>().toList(),
      imageUrl:               j['image_url'] as String?,
      lat:                    (j['lat'] as num?)?.toDouble(),
      lon:                    (j['lon'] as num?)?.toDouble(),
      descripcionBienestar:   j['descripcion_bienestar'] as String? ?? '',
      municipio:              j['municipio'] as String? ?? '',
      explicacion:            j['explicacion'] as String? ?? '',
      esMipyme:               j['es_mipyme'] as bool? ?? false,
      coincidencia:           j['coincidencia'] as String? ?? 'alta',
      motivoCoincidencia:     j['motivo_coincidencia'] as String?,
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
      title:                j['modo_viaje_label'] as String? ?? 'Lugares para ti',
      description:          j['modo_viaje_description'] as String? ?? '',
      destinations: ((j['destinations'] as List<dynamic>?) ?? [])
          .map((d) => WellnessDestination.fromJson(d as Map<String, dynamic>))
          .toList(),
      sessionId:    (j['session_id'] as num?)?.toInt(),
      avisoCoincidencia: j['aviso_coincidencia'] as String?,
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

  /// WELLTUR v2: las respuestas de estrés (opcionales) ajustan qué modalidades se
  /// priorizan según el modelo calibrado con la encuesta; no es un diagnóstico.
  Future<WellnessRecommendationResult> recommendV2({
    Map<String, int>? stressItems,
    List<int?>? pssItems,
    required List<String> modalities,
    required int maxEffort,
    required bool saveHistory,
    String? regionFilter,
    int topN = 5,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/recommend-v2'),
      body: jsonEncode({
        'preferences': {
          'modality_preferences': modalities,
          'max_effort': maxEffort,
          if (regionFilter != null && regionFilter.isNotEmpty) 'region_filter': regionFilter,
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

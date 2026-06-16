import 'dart:convert';
import '../../core/constants/api_constants.dart';
import 'api_client.dart';

/// Modelo de destino wellness recomendado
class WellnessDestination {
  final String idDestino;
  final String nombreLugar;
  final String estado;
  final String categoriaWellness;
  final double matchPct;
  final double beneficioOptimoPct;
  final double alineacionPct;
  final double wellnessSentimentScore;
  final int rank;
  final double nivelAislamiento;
  final double restauracionPasiva;
  final double demandaFisica;
  final double? lat;
  final double? lon;
  final String descripcionBienestar;
  final String beneficioDescripcion;

  const WellnessDestination({
    required this.idDestino,
    required this.nombreLugar,
    required this.estado,
    required this.categoriaWellness,
    required this.matchPct,
    required this.beneficioOptimoPct,
    required this.alineacionPct,
    required this.wellnessSentimentScore,
    required this.rank,
    required this.nivelAislamiento,
    required this.restauracionPasiva,
    required this.demandaFisica,
    this.lat,
    this.lon,
    required this.descripcionBienestar,
    required this.beneficioDescripcion,
  });

  factory WellnessDestination.fromJson(Map<String, dynamic> j) {
    return WellnessDestination(
      idDestino:              j['id_destino'] as String? ?? '',
      nombreLugar:            j['nombre_lugar'] as String? ?? '',
      estado:                 j['estado'] as String? ?? '',
      categoriaWellness:      j['categoria_wellness'] as String? ?? '',
      matchPct:               (j['match_pct'] as num?)?.toDouble() ?? 0,
      beneficioOptimoPct:     (j['beneficio_optimo_pct'] as num?)?.toDouble() ?? 0,
      alineacionPct:          (j['alineacion_pct'] as num?)?.toDouble() ?? 0,
      wellnessSentimentScore: (j['wellness_sentiment_score'] as num?)?.toDouble() ?? 0.5,
      rank:                   (j['rank'] as num?)?.toInt() ?? 0,
      nivelAislamiento:       (j['nivel_aislamiento'] as num?)?.toDouble() ?? 0.5,
      restauracionPasiva:     (j['restauracion_pasiva'] as num?)?.toDouble() ?? 0.5,
      demandaFisica:          (j['demanda_fisica'] as num?)?.toDouble() ?? 0.5,
      lat:                    (j['lat'] as num?)?.toDouble(),
      lon:                    (j['lon'] as num?)?.toDouble(),
      descripcionBienestar:   j['descripcion_bienestar'] as String? ?? '',
      beneficioDescripcion:   j['beneficio_descripcion'] as String? ?? '',
    );
  }
}

/// Respuesta del assessment wellness
class WellnessAssessmentResult {
  final String perfilInterno;
  final String modoViaje;
  final String modoViajeLabel;
  final String modoViajeDescription;
  final double confianza;
  final String metodo;
  final List<WellnessDestination> destinations;
  final int? assessmentId;
  final int? sessionId;

  const WellnessAssessmentResult({
    required this.perfilInterno,
    required this.modoViaje,
    required this.modoViajeLabel,
    required this.modoViajeDescription,
    required this.confianza,
    required this.metodo,
    required this.destinations,
    this.assessmentId,
    this.sessionId,
  });

  factory WellnessAssessmentResult.fromJson(Map<String, dynamic> j) {
    return WellnessAssessmentResult(
      perfilInterno:        j['perfil_interno'] as String? ?? '',
      modoViaje:            j['modo_viaje'] as String? ?? '',
      modoViajeLabel:       j['modo_viaje_label'] as String? ?? '',
      modoViajeDescription: j['modo_viaje_description'] as String? ?? '',
      confianza:            (j['confianza'] as num?)?.toDouble() ?? 0,
      metodo:               j['metodo'] as String? ?? '',
      destinations: ((j['destinations'] as List<dynamic>?) ?? [])
          .map((d) => WellnessDestination.fromJson(d as Map<String, dynamic>))
          .toList(),
      assessmentId: (j['assessment_id'] as num?)?.toInt(),
      sessionId:    (j['session_id'] as num?)?.toInt(),
    );
  }
}

class WellnessService {
  Uri _uri(String path) => Uri.parse('${ApiConstants.baseUrl}$path');

  /// Envía Q1-Q4 y recibe perfil + recomendaciones.
  Future<WellnessAssessmentResult> assess({
    required int q1,
    required int q2,
    required int q3,
    required int q4,
    int topN = 3,
    String? regionFilter,
    Map<String, dynamic>? userPreferences,
  }) async {
    final response = await ApiClient.post(
      _uri('/ml/wellness/assess'),
      body: jsonEncode({
        'q1': q1,
        'q2': q2,
        'q3': q3,
        'q4': q4,
        'top_n': topN,
        'consent_given': true,
        if (regionFilter != null) 'region_filter': regionFilter,
        if (userPreferences != null) 'user_preferences': userPreferences,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Error en assessment wellness: ${response.statusCode}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return WellnessAssessmentResult.fromJson(data);
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
        if (feedbackText != null) 'feedback_text': feedbackText,
      }),
    );
  }

  /// Obtiene historial de assessments del usuario.
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

import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/data/services/wellness_service.dart';

void main() {
  test('parses transparent preference-match results without synthetic health scores', () {
    final result = WellnessRecommendationResult.fromJson({
      'modo_viaje_label': 'Lugares según tus preferencias',
      'modo_viaje_description': 'Coincidencia con tus preferencias de viaje.',
      'session_id': 27,
      'destinations': [
        {
          'id_destino': 'poi:18',
          'nombre_lugar': 'Sendero del bosque',
          'estado': 'Veracruz',
          'categoria_wellness': 'Naturaleza',
          'match_pct': 100,
          'rank': 1,
          'wellness_dimensions': ['environmental'],
          'image_url': 'https://cdn.example.test/forest.jpg',
          'lat': 19.4,
          'lon': -96.9,
          'descripcion_bienestar': 'Recorrido guiado por el entorno natural.',
        },
      ],
    });

    expect(result.title, 'Lugares según tus preferencias');
    expect(result.sessionId, 27);
    expect(result.destinations, hasLength(1));
    expect(result.destinations.single.matchPct, 100);
    expect(result.destinations.single.wellnessDimensions, ['environmental']);
    expect(result.destinations.single.imageUrl, 'https://cdn.example.test/forest.jpg');
    expect(result.destinations.single.detailPagePlaceId, 'poi_18');
    expect(result.destinations.single.descripcionBienestar, contains('Recorrido guiado'));
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/data/services/wellness_service.dart';

void main() {
  test('acepta lat/lon y números enviados como texto (NUMERIC de PostgreSQL)', () {
    final r = WellnessRecommendationResult.fromJson({
      'session_id': '12',
      'aviso_coincidencia': null,
      'destinations': [
        {'id_destino': 'poi:2422', 'nombre_lugar': 'Clases de Yoga', 'lat': '18.905700', 'lon': '-96.966777', 'rank': 1, 'es_mipyme': true},
      ],
    });
    expect(r.destinations, hasLength(1));
    expect(r.destinations.first.lat, closeTo(18.9057, 1e-6));
    expect(r.destinations.first.lon, closeTo(-96.966777, 1e-6));
    expect(r.sessionId, 12);
  });
}

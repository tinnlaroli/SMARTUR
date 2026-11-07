import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/data/services/wellness_service.dart';
import 'package:smartur/presentation/widgets/wellness_poi_card.dart';

WellnessDestination _lugar(String coincidencia) => WellnessDestination(
  idDestino: 'poi:2422',
  nombreLugar: 'Administración del Parque Recreativo Coscomatepec de Bravo y Balneario Municipal',
  estado: 'Veracruz',
  municipio: 'Coscomatepec',
  categoriaWellness: 'Mente_Cuerpo',
  matchPct: 0,
  rank: 1,
  descripcionBienestar: 'Escuelas de deporte del sector privado.',
  explicacion: 'Porque buscas práctica mente-cuerpo: Escuelas de deporte del sector privado (SCIAN 611621, DENUE 0526).',
  esMipyme: true,
  lat: 18.9057,
  lon: -96.966777,
  coincidencia: coincidencia,
  motivoCoincidencia: coincidencia == 'alta' ? null : 'Está fuera de la zona que elegiste.',
  modalidades: const ['W1', 'W4', 'W7'],
);

void main() {
  for (final ancho in [320.0, 412.0]) {
    for (final c in ['alta', 'media', 'baja']) {
      testWidgets('tarjeta sin desbordes · $ancho px · coincidencia $c', (tester) async {
        tester.view.physicalSize = Size(ancho, 900);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(MaterialApp(home: Scaffold(body: SingleChildScrollView(
          child: WellnessPoiCard(destination: _lugar(c), onTap: () {}),
        ))));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(find.text('Porque buscas práctica mente-cuerpo'), findsOneWidget);
        expect(find.text('Mente y cuerpo'), findsOneWidget);
        expect(find.text('Coincidencia $c'), findsOneWidget);
        expect(find.text('Cómo llegar'), findsOneWidget);
        expect(find.text('Mente-cuerpo'), findsOneWidget);
        if (c != 'alta') expect(find.text('Está fuera de la zona que elegiste.'), findsOneWidget);
      });
    }
  }
}

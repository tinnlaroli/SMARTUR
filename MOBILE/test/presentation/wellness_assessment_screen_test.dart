import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/presentation/screens/main/wellness_assessment_screen.dart';

void usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

/// La PSS-10 se lee de un asset con E/S real: se deja avanzar fuera del reloj simulado.
Future<void> cargarPantalla(WidgetTester tester) async {
  await tester.pumpWidget(const MaterialApp(home: WellnessAssessmentScreen()));
  await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pumpAndSettle();
}

Future<void> empezar(WidgetTester tester) async {
  await cargarPantalla(tester);
  final startButton = find.text('Empezar · 4 pasos');
  await tester.ensureVisible(startButton);
  await tester.pumpAndSettle();
  await tester.tap(startButton);
  await tester.pumpAndSettle();
}

/// El texto de la PSS-10 está licenciado y el repo público solo trae la plantilla vacía;
/// el release lo escribe desde el secreto PSS10_JSON_B64. Sin texto, la app oculta la PSS-10.
bool _pssDisponible() {
  final datos = jsonDecode(File('assets/instrumentos/pss10_es_mx.json').readAsStringSync()) as Map<String, dynamic>;
  return (datos['items'] as List).every((t) => (t as String).trim().isNotEmpty);
}

void main() {
  // Cada prueba lee el asset de nuevo; una lectura en caché de otra prueba queda ligada a su reloj simulado.
  setUp(() => rootBundle.clear());

  testWidgets('explica que las preguntas de estrés son opcionales y no diagnósticas', (tester) async {
    usePhoneViewport(tester);
    await cargarPantalla(tester);

    expect(find.text('Descansa en las Altas Montañas'), findsOneWidget);
    expect(find.textContaining('no son un diagnóstico'), findsOneWidget);
    expect(find.textContaining('Opcional: guardar esta búsqueda'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Empezar · 4 pasos')).onPressed, isNotNull);
  });

  testWidgets('exige responder el cuestionario de estrés o permite omitirlo', (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);
    expect(find.text('PASO 1 DE 4'), findsOneWidget);
    // Un solo cuestionario: no se pide elegir entre dos.
    expect(find.text('PSS-10 · 10'), findsNothing);
    expect(find.text('Breve · 6'), findsNothing);

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    // PSS-10 cuando la compilación trae su texto; si no, las seis preguntas breves.
    expect(find.textContaining(_pssDisponible() ? 'al menos 8 de las 10' : 'Responde las seis preguntas'),
        findsOneWidget);

    await tester.tap(find.text('Prefiero no responder'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 2 DE 4'), findsOneWidget);
  });

  testWidgets('muestra la PSS-10 completa con su aviso de copyright', skip: !_pssDisponible(), (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);

    for (var i = 1; i <= 10; i++) {
      final item = find.textContaining(RegExp('^$i\\. Durante el último mes'));
      await tester.scrollUntilVisible(item, 200, scrollable: find.byType(Scrollable).last);
      expect(item, findsOneWidget);
    }
    expect(find.textContaining('RST Assessments'), findsOneWidget);

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.textContaining('al menos 8 de las 10'), findsOneWidget);
  });

  testWidgets('limita las modalidades a tres y muestra su orden', (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);
    await tester.tap(find.text('Prefiero no responder'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();

    for (final label in ['Mente-cuerpo', 'Autocuidado', 'Pausa y descanso', 'Movimiento']) {
      await tester.ensureVisible(find.text(label));
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
    }
    expect(find.text('Puedes elegir hasta tres.'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
  });
}

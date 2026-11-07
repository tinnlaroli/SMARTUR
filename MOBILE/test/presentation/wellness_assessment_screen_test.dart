import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartur/presentation/screens/main/wellness_assessment_screen.dart';

void usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

/// La PSS-10 se lee de un asset con E/S real: se deja avanzar fuera del reloj simulado.
Future<void> cargarPantalla(WidgetTester tester) async {
  await tester.pumpWidget(MaterialApp(
      // Como "reducir movimiento": el orbe animado no gira y pumpAndSettle puede asentarse.
      builder: (context, child) => MediaQuery(data: MediaQuery.of(context).copyWith(disableAnimations: true), child: child!),
      home: const WellnessAssessmentScreen()));
  await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pumpAndSettle();
}

Future<void> empezar(WidgetTester tester) async {
  await cargarPantalla(tester);
  final startButton = find.text('Empezar · 5 pasos');
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

    expect(find.text('Tu viaje de bienestar'), findsOneWidget);
    expect(find.textContaining('no son un diagnóstico'), findsOneWidget);
    expect(find.textContaining('Opcional: guardar esta búsqueda'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Empezar · 5 pasos')).onPressed, isNotNull);
  });

  testWidgets('exige responder el cuestionario de estrés o permite omitirlo', (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);
    expect(find.text('PASO 1 DE 5'), findsOneWidget);
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
    expect(find.text('PASO 2 DE 5'), findsOneWidget);
  });

  testWidgets('muestra la PSS-10 completa con su aviso de copyright', skip: !_pssDisponible(), (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);

    expect(find.textContaining('RST Assessments'), findsOneWidget);

    // La instrucción oficial está plegada y se abre/cierra con el botón de información.
    final datos = jsonDecode(File('assets/instrumentos/pss10_es_mx.json').readAsStringSync()) as Map<String, dynamic>;
    final instruccion = find.text(datos['instruccion'] as String);
    expect(instruccion, findsNothing);
    await tester.tap(find.byTooltip('Instrucciones de la escala'));
    await tester.pumpAndSettle();
    expect(instruccion, findsOneWidget);
    await tester.tap(find.byTooltip('Ocultar instrucciones'));
    await tester.pumpAndSettle();
    expect(instruccion, findsNothing);

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.textContaining('al menos 8 de las 10'), findsOneWidget);

    // Un ítem por pantalla: al responder, avanza solo al siguiente.
    for (var i = 1; i <= 10; i++) {
      expect(find.textContaining(RegExp('^$i\\. Durante el último mes')), findsOneWidget);
      expect(find.text('Pregunta $i de 10'), findsOneWidget);
      final opcion = find.byWidgetPredicate((w) => w is Semantics && w.properties.label == 'Algunas veces');
      await tester.ensureVisible(opcion);
      await tester.tap(opcion);
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pumpAndSettle();
    }
    expect(find.textContaining(RegExp('^10\\. Durante el último mes')), findsOneWidget);
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 2 DE 5'), findsOneWidget);
  });

  testWidgets('limita las modalidades a tres y muestra su orden', (tester) async {
    usePhoneViewport(tester);
    await empezar(tester);
    await tester.tap(find.text('Prefiero no responder'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    // Paso 2: motivos M (opcionales aquí); paso 3: modalidades W.
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 3 DE 5'), findsOneWidget);

    for (final label in ['Mente-cuerpo', 'Autocuidado', 'Pausa y descanso', 'Movimiento']) {
      await tester.ensureVisible(find.text(label));
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
    }
    expect(find.text('Puedes elegir hasta tres.'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
  });

  testWidgets('no vuelve a aplicar la PSS-10 si ya se contestó (licencia: una vez por persona)', (tester) async {
    SharedPreferences.setMockInitialValues({
      'welltur_pss10_v1': jsonEncode({'items': [3, 3, 2, 1, 1, 3, 1, 1, 3, 2], 'total': 27.0, 'fecha': '2026-11-06T10:00:00'}),
    });
    usePhoneViewport(tester);
    await empezar(tester);
    expect(find.text('PASO 1 DE 5'), findsOneWidget);
    expect(find.text('Ya contestaste la PSS-10 el 6/11/2026'), findsOneWidget);
    expect(find.text('Puntaje: 27 de 40'), findsOneWidget);
    expect(find.textContaining('Durante el último mes'), findsNothing);
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 2 DE 5'), findsOneWidget);
  });
}

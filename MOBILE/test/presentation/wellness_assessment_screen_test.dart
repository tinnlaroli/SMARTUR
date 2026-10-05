import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartur/presentation/screens/main/wellness_assessment_screen.dart';

void usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

void main() {
  testWidgets('permite continuar sin guardar historial y mantiene tres pasos breves', (tester) async {
    usePhoneViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: WellnessAssessmentScreen()));

    expect(find.text('Arma una experiencia a tu manera'), findsOneWidget);
    expect(find.textContaining('no una prueba de estrés'), findsOneWidget);
    expect(find.text('Empezar · 3 pasos'), findsOneWidget);

    final startButton = find.text('Empezar · 3 pasos');
    await tester.ensureVisible(startButton);
    await tester.pumpAndSettle();
    expect(
      tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Empezar · 3 pasos')).onPressed,
      isNotNull,
    );
    await tester.tap(startButton);
    await tester.pumpAndSettle();
    expect(find.text('PASO 1 DE 3'), findsOneWidget);
    expect(find.text('0 de 3 seleccionadas'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Continuar')).onPressed,
      isNull,
    );

    await tester.tap(find.text('Física'));
    await tester.pumpAndSettle();
    expect(find.text('1 de 3 seleccionadas'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Continuar')).onPressed,
      isNotNull,
    );
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 2 DE 3'), findsOneWidget);

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('PASO 3 DE 3'), findsOneWidget);
    expect(find.text('Todos los estados'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
  });

  testWidgets('no permite seleccionar más de tres dimensiones', (tester) async {
    usePhoneViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: WellnessAssessmentScreen()));
    final consent = find.byType(Checkbox).first;
    await tester.ensureVisible(consent);
    await tester.pumpAndSettle();
    await tester.tap(consent);
    await tester.pumpAndSettle();
    final startButton = find.text('Empezar · 3 pasos');
    await tester.ensureVisible(startButton);
    await tester.pumpAndSettle();
    await tester.tap(startButton);
    await tester.pumpAndSettle();

    for (final label in ['Física', 'Mental', 'Emocional', 'Espiritual']) {
      await tester.ensureVisible(find.text(label));
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
    }

    expect(find.text('Puedes elegir hasta tres prioridades.'), findsOneWidget);
    expect(find.text('3 de 3 seleccionadas'), findsOneWidget);
    expect(find.text('Emocional'), findsOneWidget);
  });

  testWidgets('explica que guardar el historial es opcional', (tester) async {
    usePhoneViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: WellnessAssessmentScreen()));

    expect(find.textContaining('Opcional: guardar esta búsqueda'), findsOneWidget);
    expect(find.textContaining('no guardaremos la sesión'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Empezar · 3 pasos')).onPressed,
      isNotNull,
    );
  });
}

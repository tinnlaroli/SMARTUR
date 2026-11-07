import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartur/core/settings/app_settings.dart';
import 'package:smartur/core/settings/app_settings_scope.dart';
import 'package:smartur/core/theme/welltur_theme.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'package:smartur/main.dart' show buildSmarturLightTheme;
import 'package:smartur/presentation/screens/auth/welcome_screen.dart';
import 'package:smartur/presentation/screens/main/wellness_assessment_screen.dart';

/// Pantallas reales (tamaño lógico): de un iPhone SE a una tablet.
const _pantallas = <String, Size>{
  'iPhone SE 320x568': Size(320, 568),
  'Android chico 360x640': Size(360, 640),
  'iPhone 14 390x844': Size(390, 844),
  'Android alto 412x915': Size(412, 915),
  'Tablet 800x1280': Size(800, 1280),
};

const _canalSecureStorage = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');

void usarPantalla(WidgetTester tester, Size size, {double escalaTexto = 1}) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = escalaTexto;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
}

/// Simula si el usuario tiene la huella activada (lectura de flutter_secure_storage).
void simularHuella(bool activa) {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    _canalSecureStorage,
    (call) async => call.method == 'read' && activa ? 'true' : null,
  );
}

Future<void> cargarBienvenida(WidgetTester tester, {String tema = 'light'}) async {
  SharedPreferences.setMockInitialValues({'theme_mode': tema, 'language': 'es'});
  final ajustes = (await tester.runAsync(AppSettingsNotifier.load))!;
  await tester.pumpWidget(AppSettingsScope(
    notifier: ajustes,
    child: MaterialApp(
      // Los mismos temas que la app (traen las extensiones de color que usa el fondo).
      theme: tema == 'welltur' ? buildWellturTheme() : buildSmarturLightTheme(),
      locale: const Locale('es'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const WelcomeScreen(),
    ),
  ));
  // La animación de entrada dura 1.6 s; el fondo anima sin fin, así que no se usa pumpAndSettle.
  await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
  for (var i = 0; i < 25; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

bool _seEnciman(Rect a, Rect b) => a.intersect(b).width > 1 && a.intersect(b).height > 1;

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    rootBundle.clear();
  });
  tearDown(() => simularHuella(false));

  group('Bienvenida: el eslogan se adapta a cualquier pantalla', () {
    for (final (huella, tema) in [(false, 'light'), (true, 'light'), (true, 'welltur')]) {
      for (final MapEntry(key: nombre, value: size) in _pantallas.entries) {
        testWidgets('$nombre · $tema${huella ? ' · con huella' : ''}', (tester) async {
          usarPantalla(tester, size);
          simularHuella(huella);
          await cargarBienvenida(tester, tema: tema);
          expect(tester.takeException(), isNull, reason: 'sin desbordes ni errores de layout');

          final eslogan = tester.getRect(find.text('IA que guía, Turismo que une'));
          final boton = tester.getRect(find.byType(ElevatedButton));
          final pantalla = Offset.zero & size;

          expect(pantalla.contains(eslogan.topLeft) && pantalla.contains(eslogan.bottomRight), isTrue,
              reason: 'el eslogan cabe completo en pantalla: $eslogan');
          expect(_seEnciman(eslogan, boton), isFalse, reason: 'eslogan $eslogan vs botón $boton');
          if (huella) {
            final icono = tester.getRect(find.byIcon(Icons.fingerprint));
            expect(_seEnciman(eslogan, icono), isFalse, reason: 'eslogan $eslogan vs huella $icono');
            expect(_seEnciman(icono, boton), isFalse, reason: 'huella $icono vs botón $boton');
          }

          // Parte visible del logo: ~176 de los 330.5 px de su recuadro, ya escalado en pantalla.
          final logo = tester.getRect(find.byType(Image).first);
          final logoVisible =
              Rect.fromCenter(center: logo.center, width: logo.width, height: logo.height * 176 / 330.53);
          expect(_seEnciman(eslogan, logoVisible), isFalse,
              reason: 'eslogan $eslogan vs logo visible $logoVisible');
          // Legible: no se reduce a letra diminuta.
          expect(eslogan.height, greaterThanOrEqualTo(30), reason: 'eslogan $eslogan');
          // En tablets el contenido no se estira de lado a lado.
          expect(boton.width, lessThanOrEqualTo(480 * 1.05 + 0.5)); // el botón termina su animación en escala 1.05
        });
      }
    }

    testWidgets('letra grande del sistema (200 %) en Android chico', (tester) async {
      usarPantalla(tester, const Size(360, 640), escalaTexto: 2);
      await cargarBienvenida(tester);
      expect(tester.takeException(), isNull);
      final eslogan = tester.getRect(find.text('IA que guía, Turismo que une'));
      final boton = tester.getRect(find.byType(ElevatedButton));
      expect(_seEnciman(eslogan, boton), isFalse);
      expect(eslogan.top, greaterThanOrEqualTo(0));
    });
  });

  group('Encuesta wellness sin desbordes', () {
    for (final MapEntry(key: nombre, value: size) in _pantallas.entries) {
      testWidgets(nombre, (tester) async {
        usarPantalla(tester, size);
        await tester.pumpWidget(MaterialApp(
      // Como "reducir movimiento": el orbe animado no gira y pumpAndSettle puede asentarse.
      builder: (context, child) => MediaQuery(data: MediaQuery.of(context).copyWith(disableAnimations: true), child: child!),
      home: const WellnessAssessmentScreen()));
        await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);

        final empezar = find.text('Empezar · 5 pasos');
        await tester.ensureVisible(empezar);
        await tester.pumpAndSettle();
        await tester.tap(empezar);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(find.text('PASO 1 DE 5'), findsOneWidget);

        // Un solo formulario: estrés (omitido) -> motivos M -> modalidades W -> esfuerzo -> zona.
        await tester.tap(find.text('Prefiero no responder'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Continuar'));
        await tester.pumpAndSettle();
        expect(find.text('PASO 2 DE 5'), findsOneWidget);
        expect(find.text('Descansar o hacer una pausa'), findsOneWidget);
        await tester.tap(find.text('Descansar o hacer una pausa'));
        await tester.pumpAndSettle();
        for (final paso in ['PASO 3 DE 5', 'PASO 4 DE 5', 'PASO 5 DE 5']) {
          await tester.tap(find.text('Continuar'));
          await tester.pumpAndSettle();
          expect(find.text(paso), findsOneWidget);
          expect(tester.takeException(), isNull);
        }
        expect(find.text('Altas Montañas'), findsOneWidget);
        await tester.tap(find.text('Todo México'));
        await tester.pumpAndSettle();
        expect(find.text('Un estado'), findsOneWidget);
        expect(tester.takeException(), isNull);
      });
    }
  });
}

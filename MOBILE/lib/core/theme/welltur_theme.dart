import 'package:flutter/material.dart';
import '../motion/smartur_routes.dart';
import 'smartur_theme_extensions.dart';

/// Paleta oficial WELLTUR. Es la única fuente de estos colores en la app: el tema
/// Welltur y las pantallas de bienestar (banner, encuesta, tarjetas) la usan.
///
/// Proporción de marca: crema 60 % (fondos) · verde botánico 20 % (primario) ·
/// verde pino 10 % (texto y estructura) · arena 7 % (secundario) · terracota 3 % (acento).
///
/// Contraste WCAG sobre crema: pino 8.8 · botánico profundo 5.8 · terracota profunda 5.1.
/// El botánico (4.1) va en rellenos con texto blanco (4.7), no en texto pequeño;
/// la arena (1.5) y la terracota del logo (2.8) son solo relleno, nunca texto.
abstract final class WellturPalette {
  static const Color crema = Color(0xFFF4EFE5);
  static const Color botanico = Color(0xFF587C68);
  static const Color pino = Color(0xFF29483B);
  static const Color arena = Color(0xFFD8C6A3);

  /// Acento de marca (≈ 3 %): la terracota del pin del logo. Solo rellenos e ilustración.
  static const Color terracota = Color(0xFFC97E5D);

  /// Terracota legible para llamadas a la acción y texto (blanco encima: 5.9).
  static const Color terracotaProfunda = Color(0xFF9C4F2E);

  // Tonos derivados para texto legible y superficies.
  static const Color botanicoProfundo = Color(0xFF46634F);
  static const Color botanicoClaro = Color(0xFF8DB39C);
  static const Color cremaProfunda = Color(0xFFEBE3D3);
  static const Color cremaClara = Color(0xFFFBF8F2);
  static const Color arenaClara = Color(0xFFEFE5D2);
  static const Color verdeNiebla = Color(0xFFDDE7DF);
  static const Color tintaOscura = Color(0xFF10201A);

  static bool _oscuro(BuildContext context) => Theme.of(context).brightness == Brightness.dark;

  /// Acento de bienestar legible en el modo activo (texto, íconos, rellenos).
  static Color acento(BuildContext context) => _oscuro(context) ? botanicoClaro : botanicoProfundo;

  /// Texto sobre un relleno [acento].
  static Color sobreAcento(BuildContext context) => _oscuro(context) ? tintaOscura : Colors.white;
}

const _scheme = ColorScheme(
  brightness: Brightness.light,
  primary: WellturPalette.botanico,
  onPrimary: Colors.white,
  primaryContainer: WellturPalette.verdeNiebla,
  onPrimaryContainer: WellturPalette.pino,
  secondary: WellturPalette.arena,
  onSecondary: WellturPalette.pino,
  secondaryContainer: WellturPalette.arenaClara,
  onSecondaryContainer: WellturPalette.pino,
  tertiary: WellturPalette.terracotaProfunda,
  onTertiary: Colors.white,
  tertiaryContainer: Color(0xFFF3DFD3),
  onTertiaryContainer: Color(0xFF6B3219),
  error: Color(0xFFBA1A1A),
  onError: Colors.white,
  errorContainer: Color(0xFFFFDAD6),
  onErrorContainer: Color(0xFF410002),
  surface: WellturPalette.crema,
  onSurface: WellturPalette.pino,
  surfaceContainerLowest: WellturPalette.cremaClara,
  surfaceContainerLow: Color(0xFFF0EADD),
  surfaceContainer: WellturPalette.cremaProfunda,
  surfaceContainerHigh: Color(0xFFE6DCC8),
  surfaceContainerHighest: Color(0xFFE0D4BC),
  onSurfaceVariant: WellturPalette.botanicoProfundo,
  outline: WellturPalette.botanico,
  outlineVariant: WellturPalette.arena,
  shadow: Colors.black,
  scrim: Colors.black,
  inverseSurface: WellturPalette.pino,
  onInverseSurface: WellturPalette.crema,
  inversePrimary: Color(0xFFA9C7B5),
  surfaceTint: WellturPalette.botanico,
);

ThemeData buildWellturTheme() {
  return ThemeData(
    extensions: <ThemeExtension<dynamic>>[
      SmarturSemanticColors(
        onImageText: Colors.white,
        onImageMuted: Colors.white70,
        imageScrimSoft: Colors.black.withValues(alpha: 0.22),
        imageScrimStrong: Colors.black.withValues(alpha: 0.52),
        overlayBorder: Colors.white.withValues(alpha: 0.20),
        success: WellturPalette.botanicoProfundo,
        warning: const Color(0xFF8A6A2F),
        danger: const Color(0xFFBA1A1A),
        info: WellturPalette.pino,
        panelBackground: WellturPalette.cremaProfunda,
        // Brand palette — WellTur overrides
        accent: WellturPalette.botanico,
        altAccent: WellturPalette.pino,
        sea: WellturPalette.botanicoProfundo,
        leaf: WellturPalette.botanico,
        ember: WellturPalette.terracotaProfunda,
      ),
    ],
    useMaterial3: true,
    fontFamily: 'Outfit',
    colorScheme: _scheme,
    scaffoldBackgroundColor: WellturPalette.crema,
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.bold, color: WellturPalette.pino),
      displayMedium: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.bold, color: WellturPalette.pino),
      titleLarge: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.w600, color: WellturPalette.pino),
      bodyMedium: TextStyle(color: WellturPalette.pino),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: WellturPalette.crema,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
          fontFamily: 'CalSans', fontSize: 20, color: WellturPalette.pino),
      iconTheme: IconThemeData(color: WellturPalette.pino),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: WellturPalette.botanico,
        foregroundColor: Colors.white,
        elevation: 4,
        shadowColor: WellturPalette.pino.withValues(alpha: 0.25),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
            fontFamily: 'CalSans', fontSize: 18, fontWeight: FontWeight.bold),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: WellturPalette.pino,
        side: const BorderSide(color: WellturPalette.botanico, width: 2),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
            fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: WellturPalette.botanico,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
            fontFamily: 'CalSans', fontSize: 16, fontWeight: FontWeight.w700),
      ),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: SmarturPageTransitionsBuilder(),
        TargetPlatform.iOS: SmarturPageTransitionsBuilder(),
        TargetPlatform.macOS: SmarturPageTransitionsBuilder(),
        TargetPlatform.windows: SmarturPageTransitionsBuilder(),
        TargetPlatform.linux: SmarturPageTransitionsBuilder(),
      },
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: WellturPalette.cremaClara,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFE2D7C2)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),
    tabBarTheme: const TabBarThemeData(
      indicatorSize: TabBarIndicatorSize.tab,
      labelColor: WellturPalette.pino,
      unselectedLabelColor: WellturPalette.botanicoProfundo,
      labelStyle: TextStyle(
          fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 13),
      dividerColor: Colors.transparent,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: WellturPalette.cremaClara,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: WellturPalette.botanico),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: WellturPalette.botanico),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: WellturPalette.pino, width: 2),
      ),
      labelStyle: const TextStyle(fontFamily: 'Outfit', color: WellturPalette.botanicoProfundo),
    ),
  );
}

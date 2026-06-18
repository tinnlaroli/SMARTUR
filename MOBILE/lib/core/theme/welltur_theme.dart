import 'package:flutter/material.dart';
import '../motion/smartur_routes.dart';
import 'smartur_theme_extensions.dart';

// ── Paleta WellTur ──────────────────────────────────────────────────────────
const Color _rosaViejo    = Color(0xFFCD6184); // primary
const Color _vinoProf     = Color(0xFF862B48); // onPrimaryContainer
const Color _verdeSalvia  = Color(0xFF97A273); // secondary / outline
const Color _oliva        = Color(0xFF545E34); // onSecondaryContainer / text muted
const Color _mostaza      = Color(0xFFFFBD59); // tertiary / warning
const Color _rosaPastel   = Color(0xFFFFECF2); // surface / scaffold bg
const Color _rosaOscuro   = Color(0xFFAB4364); // onSurface / main text
const Color _verdeBosque  = Color(0xFFB2CF9A); // surfaceContainerHighest
const Color _verdeMenta   = Color(0xFF5EB03C); // success / active

const _scheme = ColorScheme(
  brightness: Brightness.light,
  primary: _rosaViejo,
  onPrimary: Colors.white,
  primaryContainer: Color(0xFFF2C4D3),
  onPrimaryContainer: _vinoProf,
  secondary: _verdeSalvia,
  onSecondary: Colors.white,
  secondaryContainer: Color(0xFFE4ECDA),
  onSecondaryContainer: _oliva,
  tertiary: _mostaza,
  onTertiary: Color(0xFF3D2400),
  tertiaryContainer: Color(0xFFFFF4DE),
  onTertiaryContainer: Color(0xFFB87205),
  error: Color(0xFFBA1A1A),
  onError: Colors.white,
  errorContainer: Color(0xFFFFDAD6),
  onErrorContainer: Color(0xFF410002),
  surface: _rosaPastel,
  onSurface: _rosaOscuro,
  surfaceContainerHighest: _verdeBosque,
  onSurfaceVariant: _oliva,
  outline: _verdeSalvia,
  outlineVariant: Color(0xFFD0DBB8),
  shadow: Colors.black,
  scrim: Colors.black,
  inverseSurface: Color(0xFF3B2028),
  onInverseSurface: Color(0xFFFFECF2),
  inversePrimary: Color(0xFFFFB1C8),
  surfaceTint: _rosaViejo,
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
        success: _verdeMenta,
        warning: _mostaza,
        danger: _vinoProf,
        info: _verdeSalvia,
        panelBackground: const Color(0xFFF5E0EA),
        // Brand palette — WellTur overrides
        accent: _rosaViejo,
        altAccent: _vinoProf,
        sea: _verdeSalvia,
        leaf: _verdeMenta,
        ember: _mostaza,
      ),
    ],
    useMaterial3: true,
    fontFamily: 'Outfit',
    colorScheme: _scheme,
    scaffoldBackgroundColor: _rosaPastel,
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.bold, color: _rosaOscuro),
      displayMedium: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.bold, color: _rosaOscuro),
      titleLarge: TextStyle(
        fontFamily: 'CalSans', fontWeight: FontWeight.w600, color: _rosaOscuro),
      bodyMedium: TextStyle(color: _rosaOscuro),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: _rosaPastel,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
          fontFamily: 'CalSans', fontSize: 20, color: _rosaOscuro),
      iconTheme: IconThemeData(color: _rosaOscuro),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _rosaViejo,
        foregroundColor: Colors.white,
        elevation: 4,
        shadowColor: _rosaViejo.withValues(alpha: 0.30),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
            fontFamily: 'CalSans', fontSize: 18, fontWeight: FontWeight.bold),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _rosaViejo,
        side: const BorderSide(color: _rosaViejo, width: 2),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
            fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: _rosaViejo,
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
      color: const Color(0xFFF8E0EC).withValues(alpha: 0.7),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFE8C4D4)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),
    tabBarTheme: const TabBarThemeData(
      indicatorSize: TabBarIndicatorSize.tab,
      labelColor: _rosaViejo,
      unselectedLabelColor: _oliva,
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
      fillColor: const Color(0xFFFADFEB),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _verdeSalvia),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _verdeSalvia),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _rosaViejo, width: 2),
      ),
      labelStyle: const TextStyle(fontFamily: 'Outfit', color: _oliva),
    ),
  );
}

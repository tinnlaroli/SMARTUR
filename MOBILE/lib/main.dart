import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:toastification/toastification.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'core/theme/style_guide.dart';
import 'core/settings/app_settings.dart';
import 'core/settings/app_settings_scope.dart';
import 'data/services/api_client.dart';
import 'data/services/auth_service.dart';
import 'presentation/screens/auth/onboarding_screen.dart';
import 'presentation/screens/auth/welcome_screen.dart';
import 'presentation/screens/main/main_screen.dart';
import 'presentation/widgets/smartur_loader.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SharedPreferences prefs = await SharedPreferences.getInstance();
  bool seenOnboarding = prefs.getBool('onboarding_seen') ?? false;

  final settings = await AppSettingsNotifier.load();
  runApp(SmarturApp(seenOnboarding: seenOnboarding, settings: settings));
}

class SmarturApp extends StatelessWidget {
  final bool seenOnboarding;
  final AppSettingsNotifier settings;
  const SmarturApp({super.key, required this.seenOnboarding, required this.settings});

  @override
  Widget build(BuildContext context) {
    return ToastificationWrapper(
      child: ValueListenableBuilder<AppSettings>(
        valueListenable: settings,
        builder: (context, appSettings, _) {
          return AppSettingsScope(
            notifier: settings,
            child: MaterialApp(
              title: 'SMARTUR',
              debugShowCheckedModeBanner: false,
              themeMode: appSettings.themeMode,
              theme: _buildLightTheme(),
              darkTheme: _buildDarkTheme(),
              locale: appSettings.locale,
              supportedLocales: AppLocalizations.supportedLocales,
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              home: _SplashGate(seenOnboarding: seenOnboarding),
            ),
          );
        },
      ),
    );
  }
}

ThemeData _baseTheme(ColorScheme scheme) {
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Outfit',
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'CalSans',
        fontWeight: FontWeight.bold,
        color: scheme.onSurface,
      ),
      displayMedium: TextStyle(
        fontFamily: 'CalSans',
        fontWeight: FontWeight.bold,
        color: scheme.onSurface,
      ),
      titleLarge: TextStyle(
        fontFamily: 'CalSans',
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
      bodyMedium: TextStyle(color: scheme.onSurface),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surface,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: 'CalSans',
        fontSize: 20,
        color: scheme.onSurface,
      ),
      iconTheme: IconThemeData(color: scheme.onSurface),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        elevation: 4,
        shadowColor: scheme.primary.withValues(alpha: 0.3),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        textStyle: const TextStyle(
          fontFamily: 'CalSans',
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: scheme.primary,
        side: BorderSide(color: scheme.primary, width: 2),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        textStyle: const TextStyle(
          fontFamily: 'Outfit',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surfaceContainerHighest,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
      labelStyle: TextStyle(
        fontFamily: 'Outfit',
        color: scheme.onSurfaceVariant,
      ),
    ),
  );
}

ThemeData _buildLightTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: SmarturStyle.purple,
    primary: SmarturStyle.purple,
    secondary: SmarturStyle.pink,
    brightness: Brightness.light,
  );
  return _baseTheme(scheme);
}

ThemeData _buildDarkTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: SmarturStyle.purple,
    primary: SmarturStyle.purple,
    secondary: SmarturStyle.pink,
    brightness: Brightness.dark,
    surface: const Color(0xFF121212),
  ).copyWith(
    surface: const Color(0xFF121212),
    surfaceContainer: const Color(0xFF1E1E1E),
    surfaceContainerHighest: const Color(0xFF242424),
  );
  return _baseTheme(scheme);
}

class _SplashGate extends StatefulWidget {
  final bool seenOnboarding;
  const _SplashGate({required this.seenOnboarding});

  @override
  State<_SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<_SplashGate> {
  bool _showLoader = true;
  bool? _hasSession;
  String? _userName;
  StreamSubscription<void>? _sessionExpiredSub;

  @override
  void initState() {
    super.initState();
    if (!widget.seenOnboarding) {
      _showLoader = false;
    }
    _checkSession();

    // Escuchar 401s globales desde cualquier servicio → redirigir a login
    _sessionExpiredSub = ApiClient.onSessionExpired.listen((_) {
      _handleGlobalSessionExpired();
    });
  }

  @override
  void dispose() {
    _sessionExpiredSub?.cancel();
    super.dispose();
  }

  void _handleGlobalSessionExpired() async {
    final auth = AuthService();
    await auth.fullLogout();
    if (!mounted) return;
    // Resetear estado local
    setState(() {
      _hasSession = false;
      _userName = null;
      _showLoader = false;
    });
    // Navegar a WelcomeScreen limpiando el stack
    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const WelcomeScreen()),
      (_) => false,
    );
  }

  Future<void> _checkSession() async {
    final auth = AuthService();

    // 1. Verificación local rápida (expiry, token presente)
    final hasLocal = await auth.hasSession();
    if (!hasLocal) {
      if (mounted) setState(() { _hasSession = false; _userName = null; });
      return;
    }

    // 2. Validación contra el servidor (detecta tokens revocados / secreto rotado)
    final isValid = await auth.validateTokenWithServer();
    if (!isValid) {
      if (mounted) setState(() { _hasSession = false; _userName = null; });
      return;
    }

    final name = await auth.getUserName();
    if (mounted) {
      setState(() {
        _hasSession = true;
        _userName = name;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final destination = _destination();
    // Nunca mostramos loader en el onboarding inicial.
    final shouldShowLoader = _showLoader && widget.seenOnboarding;

    return Stack(
      children: [
        // Contenido real de la app (welcome / onboarding / main)
        destination,
        // Loader como overlay a pantalla completa para continuidad perfecta
        if (shouldShowLoader)
          Positioned.fill(
            child: SmartURLoader(
              key: const ValueKey('loader'),
              onFinished: () => setState(() => _showLoader = false),
            ),
          ),
      ],
    );
  }

  Widget _destination() {
    if (_hasSession == true) {
      return MainScreen(key: const ValueKey('main'), userName: _userName);
    }
    return widget.seenOnboarding
        ? const WelcomeScreen(
            key: ValueKey('welcome'),
            fromSplash: true,
          )
        : const OnboardingScreen(key: ValueKey('onboarding'));
  }
}
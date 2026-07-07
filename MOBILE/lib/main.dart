import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:toastification/toastification.dart';
import 'package:smartur/l10n/app_localizations.dart';
import 'core/motion/smartur_routes.dart';
import 'core/navigation/notification_router.dart';
import 'core/theme/style_guide.dart';
import 'core/theme/smartur_theme_extensions.dart';
import 'core/theme/welltur_theme.dart';
import 'core/settings/app_settings.dart';
import 'core/settings/app_settings_scope.dart';
import 'data/services/api_client.dart';
import 'data/services/auth_service.dart';
import 'data/services/notification_service.dart';
import 'data/services/update_service.dart';
import 'presentation/screens/auth/onboarding_screen.dart';
import 'presentation/screens/auth/welcome_screen.dart';
import 'presentation/screens/main/main_screen.dart';
import 'presentation/widgets/smartur_loader.dart';

/// Indica si Firebase se inicializó correctamente.
/// Usar para deshabilitar FCM graciosamente cuando no está disponible.
bool kFirebaseAvailable = false;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Captura errores del framework Flutter para evitar pantallas en blanco
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
  };

  try {
    await Firebase.initializeApp();
    kFirebaseAvailable = true;
  } catch (e) {
    debugPrint('[main] Firebase init failed (FCM unavailable): $e');
    // kFirebaseAvailable permanece false — NotificationService lo verifica
  }

  try {
    await NotificationService.setup();
  } catch (e) {
    debugPrint('[main] NotificationService setup failed: $e');
  }

  SharedPreferences prefs = await SharedPreferences.getInstance();
  bool seenOnboarding = prefs.getBool('onboarding_seen') ?? false;

  final settings = await AppSettingsNotifier.load();
  runApp(SmarturApp(seenOnboarding: seenOnboarding, settings: settings));

  // Deep links — smartur://app/<screen>
  void handleDeepLink(Uri uri) {
    if (uri.scheme != 'smartur') return;
    final screen = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : null;
    if (screen != null) pendingNotificationScreen.value = screen;
  }

  try {
    final appLinks = AppLinks();
    final initial = await appLinks.getInitialLink();
    if (initial != null) handleDeepLink(initial);
    appLinks.uriLinkStream.listen(handleDeepLink, onError: (_) {});
  } catch (_) {}
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
          final isWelltur = appSettings.themeMode == AppThemeMode.welltur;
          final flutterThemeMode = switch (appSettings.themeMode) {
            AppThemeMode.light   => ThemeMode.light,
            AppThemeMode.dark    => ThemeMode.dark,
            AppThemeMode.welltur => ThemeMode.light,
            AppThemeMode.system  => ThemeMode.system,
          };
          return AppSettingsScope(
            notifier: settings,
            child: MaterialApp(
              title: 'Welltur',
              debugShowCheckedModeBanner: false,
              themeMode: flutterThemeMode,
              theme: isWelltur ? buildWellturTheme() : _buildLightTheme(),
              darkTheme: isWelltur ? buildWellturTheme() : _buildDarkTheme(),
              locale: appSettings.locale,
              supportedLocales: AppLocalizations.supportedLocales,
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              // Evita que el tamaño de letra del sistema (accesibilidad) del
              // teléfono del usuario descuadre el layout diseñado; se permite
              // un rango razonable sin dejar que crezca sin control.
              builder: (context, child) {
                return MediaQuery.withClampedTextScaling(
                  minScaleFactor: 0.9,
                  maxScaleFactor: 1.15,
                  child: child!,
                );
              },
              home: _AppLifecycleWatcher(
                child: _SplashGate(seenOnboarding: seenOnboarding),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Tras volver del instalador del sistema, revalida la versión instalada.
class _AppLifecycleWatcher extends StatefulWidget {
  final Widget child;
  const _AppLifecycleWatcher({required this.child});

  @override
  State<_AppLifecycleWatcher> createState() => _AppLifecycleWatcherState();
}

class _AppLifecycleWatcherState extends State<_AppLifecycleWatcher>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      UpdateService.invalidateCache();
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

ThemeData _baseTheme(ColorScheme scheme) {
  final isDark = scheme.brightness == Brightness.dark;
  return ThemeData(
    extensions: <ThemeExtension<dynamic>>[
      SmarturSemanticColors(
        onImageText: Colors.white,
        onImageMuted: isDark ? Colors.white70 : Colors.white60,
        imageScrimSoft: isDark
            ? Colors.black.withValues(alpha: 0.45)
            : Colors.black.withValues(alpha: 0.25),
        imageScrimStrong: isDark
            ? Colors.black.withValues(alpha: 0.72)
            : Colors.black.withValues(alpha: 0.55),
        overlayBorder: Colors.white.withValues(alpha: isDark ? 0.22 : 0.16),
        success: SmarturStyle.green,
        warning: SmarturStyle.orange,
        danger: SmarturStyle.pink,
        info: SmarturStyle.blue,
        panelBackground: scheme.surfaceContainerHighest,
        accent: SmarturStyle.purple,
        altAccent: SmarturStyle.pink,
        sea: SmarturStyle.blue,
        leaf: SmarturStyle.green,
        ember: SmarturStyle.orange,
      ),
    ],
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
      centerTitle: false,
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
      color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outline.withValues(alpha: 0.08)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(
          fontFamily: 'CalSans',
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    tabBarTheme: TabBarThemeData(
      indicatorSize: TabBarIndicatorSize.tab,
      labelColor: scheme.primary,
      unselectedLabelColor: scheme.onSurfaceVariant,
      labelStyle: const TextStyle(
        fontFamily: 'Outfit',
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      dividerColor: Colors.transparent,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
  bool _sessionReady = false;
  bool _animationFinished = false;
  bool? _hasSession;
  String? _userName;
  StreamSubscription<void>? _sessionExpiredSub;

  @override
  void initState() {
    super.initState();
    if (!widget.seenOnboarding) {
      _showLoader = false;
      _sessionReady = true;
      _animationFinished = true;
    } else {
      // Safety timeout — never leave the loader stuck.
      Future.delayed(const Duration(seconds: 10), () {
        if (mounted && _showLoader) setState(() {
          _showLoader = false;
          _animationFinished = true;
        });
      });
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

  void _onAnimationFinished() {
    if (mounted) setState(() => _animationFinished = true);
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
      smarturFadeRoute(const WelcomeScreen()),
      (_) => false,
    );
  }

  Future<void> _checkSession() async {
    final auth = AuthService();

    // 1. Verificación local rápida (expiry, token presente)
    final hasLocal = await auth.hasSession();
    if (!hasLocal) {
      if (mounted) setState(() {
        _hasSession = false;
        _userName = null;
        _sessionReady = true;
      });
      return;
    }

    // 2. Validación contra el servidor (detecta tokens revocados / secreto rotado)
    final isValid = await auth.validateTokenWithServer();
    if (!isValid) {
      if (mounted) setState(() {
        _hasSession = false;
        _userName = null;
        _sessionReady = true;
      });
      return;
    }

    final name = await auth.getUserName();
    if (mounted) {
      setState(() {
        _hasSession = true;
        _userName = name;
        _sessionReady = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final destination = _destination();
    final shouldShowLoader = _showLoader && widget.seenOnboarding;
    final fadeOut = _sessionReady && _animationFinished;

    return Stack(
      children: [
        destination,
        if (shouldShowLoader)
          Positioned.fill(
            child: AnimatedOpacity(
              opacity: fadeOut ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 300),
              onEnd: () {
                if (fadeOut && mounted) setState(() => _showLoader = false);
              },
              child: SmartURLoader(
                showBackground: true,
                onFinished: _onAnimationFinished,
              ),
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
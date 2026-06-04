import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/navigation/notification_router.dart';
import '../../main.dart' show kFirebaseAvailable;

enum NotificationStatus { enabled, disabled, permissionDenied, unavailable }

/// Maneja notificaciones push via Firebase Cloud Messaging.
///
/// Flujo de dos etapas:
/// 1. [setup] — llamar en main() después de Firebase.initializeApp().
///    Configura listeners globales sin pedir permisos al usuario.
/// 2. [registerWithApi] — llamar en MainScreen después del login.
///    Pide permisos (primera vez), obtiene token y lo registra en API.
class NotificationService {
  static bool _setupDone = false;
  static bool _registered = false;
  static String? _cachedToken;

  /// Etapa 1: inicializa listeners de sistema sin pedir permisos al usuario.
  /// Los permisos se solicitan en [registerWithApi] — ya dentro de la app tras el login.
  static Future<void> setup() async {
    if (_setupDone) return;
    if (!kFirebaseAvailable) {
      debugPrint('[FCM] Firebase no disponible — setup omitido.');
      return;
    }

    try {
      final messaging = FirebaseMessaging.instance;

      // Obtener token solo si los permisos ya fueron concedidos previamente
      // (segunda apertura). Si no, se piden en registerWithApi tras el login.
      final current = await messaging.getNotificationSettings();
      if (current.authorizationStatus == AuthorizationStatus.authorized ||
          current.authorizationStatus == AuthorizationStatus.provisional) {
        _cachedToken = await messaging.getToken();
      }
      debugPrint('[FCM] Token obtenido: ${_cachedToken?.substring(0, 20)}...');

      // Renovaciones automáticas de token
      messaging.onTokenRefresh.listen((newToken) {
        _cachedToken = newToken;
        if (_registered) _registerToken(newToken, 'android');
      });

      // Handler para mensajes con la app cerrada (top-level, sin contexto)
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Tap desde background — app ya estaba abierta
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Tap desde app cerrada (cold start)
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _handleNotificationTap(initial));
      }

      _setupDone = true;
      debugPrint('[FCM] Setup completado.');
    } catch (e) {
      debugPrint('[FCM] Error en setup: $e');
    }
  }

  /// Etapa 2: pide permisos (primera vez), obtiene token y lo registra en API.
  /// Llamar en MainScreen.initState() después del primer frame — ya dentro de la app.
  static Future<void> registerWithApi({BuildContext? context}) async {
    if (!kFirebaseAvailable) {
      debugPrint('[FCM] Firebase no disponible — registro omitido.');
      return;
    }
    if (!_setupDone) await setup();
    if (_registered) return;

    // Solicitar permisos aquí — el usuario ya completó el login
    if (_cachedToken == null) {
      try {
        final messaging = FirebaseMessaging.instance;
        final settings = await messaging.requestPermission(
          alert: true, badge: true, sound: true,
        );
        if (settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional) {
          _cachedToken = await messaging.getToken();
        }
      } catch (_) {}
    }

    // Registrar token en la API (requiere sesión activa)
    if (_cachedToken != null) {
      await _registerToken(_cachedToken!, 'android');
    }

    // Listener de mensajes en primer plano con contexto para banners
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Mensaje en primer plano: ${message.notification?.title}');
      if (context != null && context.mounted) {
        _showForegroundBanner(context, message);
      }
    });

    _registered = true;
    debugPrint('[FCM] Registro con API completado.');
  }

  /// Reset completo — llamar en logout para que el próximo login vuelva a registrar.
  static void reset() {
    _registered = false;
  }

  static const _prefKey = 'notifications_enabled';

  /// Devuelve el estado actual: permiso OS + preferencia guardada.
  static Future<NotificationStatus> getStatus() async {
    if (!kFirebaseAvailable) return NotificationStatus.unavailable;
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return NotificationStatus.permissionDenied;
    }
    final prefs = await SharedPreferences.getInstance();
    final enabled = prefs.getBool(_prefKey) ?? true;
    return enabled ? NotificationStatus.enabled : NotificationStatus.disabled;
  }

  /// Activa notificaciones: pide permiso OS si falta → registra token → guarda preferencia.
  static Future<NotificationStatus> enable() async {
    if (!kFirebaseAvailable) return NotificationStatus.unavailable;
    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(alert: true, badge: true, sound: true);
    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      return NotificationStatus.permissionDenied;
    }
    _cachedToken ??= await messaging.getToken();
    if (_cachedToken != null) await _registerToken(_cachedToken!, 'android');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, true);
    _registered = true;
    return NotificationStatus.enabled;
  }

  /// Desactiva notificaciones: elimina token del API → guarda preferencia.
  static Future<void> disable() async {
    if (!kFirebaseAvailable) return;
    try {
      await ApiClient.delete(Uri.parse('${ApiConstants.baseUrl}/me/device-token'));
    } catch (e) {
      debugPrint('[FCM] Error desregistrando token: $e');
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, false);
    _registered = false;
  }

  static Future<void> _registerToken(String token, String platform) async {
    const maxAttempts = 3;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await ApiClient.post(
          Uri.parse('${ApiConstants.baseUrl}/me/device-token'),
          body: json.encode({'token': token, 'platform': platform}),
        );
        debugPrint('[FCM] Token registrado en API.');
        return;
      } catch (e) {
        debugPrint('[FCM] Intento $attempt/$maxAttempts falló: $e');
        if (attempt < maxAttempts) {
          await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
        }
      }
    }
    debugPrint('[FCM] No se pudo registrar el token tras $maxAttempts intentos.');
  }

  static void _handleNotificationTap(RemoteMessage message) {
    final screen = message.data['screen'] as String?;
    debugPrint('[FCM] Tap en notificación — screen: $screen');
    if (screen != null) pendingNotificationScreen.value = screen;
  }

  static void _showForegroundBanner(BuildContext context, RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              notification.title ?? 'SMARTUR',
              style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700),
            ),
            if (notification.body != null)
              Text(
                notification.body!,
                style: const TextStyle(fontFamily: 'Outfit', fontSize: 12),
              ),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1A1F2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}

/// Handler de mensajes en segundo plano — debe ser top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM] Mensaje en background: ${message.notification?.title}');
}

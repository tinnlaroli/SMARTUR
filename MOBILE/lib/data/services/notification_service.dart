import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

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

      // Registro en app abierta desde notificación
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App abierta desde notificación: ${message.notification?.title}');
      });

      _setupDone = true;
      debugPrint('[FCM] Setup completado.');
    } catch (e) {
      debugPrint('[FCM] Error en setup: $e');
    }
  }

  /// Etapa 2: pide permisos (primera vez), obtiene token y lo registra en API.
  /// Llamar en MainScreen.initState() después del primer frame — ya dentro de la app.
  static Future<void> registerWithApi({BuildContext? context}) async {
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

import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

/// Maneja notificaciones push via Firebase Cloud Messaging.
///
/// Uso:
/// ```dart
/// await NotificationService.init(context: context);
/// ```
class NotificationService {
  static bool _initialized = false;

  /// Inicializa Firebase + FCM, solicita permisos y registra el token en la API.
  /// Debe llamarse después de un login exitoso.
  static Future<void> init({BuildContext? context}) async {
    if (_initialized) return;

    try {
      final messaging = FirebaseMessaging.instance;

      // Solicitar permiso (Android 13+, iOS)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus != AuthorizationStatus.authorized &&
          settings.authorizationStatus != AuthorizationStatus.provisional) {
        debugPrint('[FCM] Permiso de notificaciones denegado.');
        return;
      }

      // Obtener y registrar el token
      final token = await messaging.getToken();
      if (token != null) {
        await _registerToken(token, 'android');
      }

      // Escuchar renovaciones de token
      messaging.onTokenRefresh.listen((newToken) {
        _registerToken(newToken, 'android');
      });

      // Mensajes en primer plano — mostrar snack si hay contexto
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM] Mensaje en primer plano: ${message.notification?.title}');
        if (context != null && context.mounted) {
          _showForegroundBanner(context, message);
        }
      });

      // Mensaje en segundo plano (app abierta desde notificación)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App abierta desde notificación: ${message.notification?.title}');
      });

      // Handler para mensajes cuando la app está cerrada
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      _initialized = true;
      debugPrint('[FCM] Inicializado correctamente. Token: ${token?.substring(0, 20)}...');
    } catch (e) {
      debugPrint('[FCM] Error inicializando: $e');
    }
  }

  /// Registra/actualiza el token en la API SMARTUR.
  static Future<void> _registerToken(String token, String platform) async {
    try {
      await ApiClient.post(
        Uri.parse('${ApiConstants.baseUrl}/me/device-token'),
        body: json.encode({'token': token, 'platform': platform}),
      );
      debugPrint('[FCM] Token registrado en API.');
    } catch (e) {
      debugPrint('[FCM] Error registrando token en API: $e');
    }
  }

  /// Muestra un banner in-app cuando llega un mensaje en primer plano.
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

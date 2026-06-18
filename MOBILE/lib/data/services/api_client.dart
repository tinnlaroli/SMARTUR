import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'auth_service.dart';

/// Centralized HTTP client for all SMARTUR API calls.
///
/// Responsibilities:
/// - Injects Authorization header on every request.
/// - Attempts silent token refresh on 401 before broadcasting [onSessionExpired].
/// - Classifies network errors into [ApiException] subtypes.
/// - Enforces a consistent default timeout.
class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _defaultTimeout = Duration(seconds: 20);

  // ── Session-expired broadcast ──────────────────────────────────────────────

  static final _sessionExpiredCtrl = StreamController<void>.broadcast();

  /// Emits whenever a 401 cannot be recovered via token refresh.
  /// Listen once at the app root and navigate to WelcomeScreen.
  static Stream<void> get onSessionExpired => _sessionExpiredCtrl.stream;

  // Refresh reentrancy guard — prevents multiple parallel refresh attempts.
  static bool _isRefreshing = false;

  // ── Public HTTP helpers ────────────────────────────────────────────────────

  static Future<http.Response> get(
    Uri uri, {
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      (h) => http.get(uri, headers: {...h, ...?extraHeaders}),
      timeout: timeout,
    );
  }

  static Future<http.Response> post(
    Uri uri, {
    Object? body,
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      (h) => http.post(uri, headers: {...h, ...?extraHeaders}, body: body),
      timeout: timeout,
    );
  }

  static Future<http.Response> patch(
    Uri uri, {
    Object? body,
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      (h) => http.patch(uri, headers: {...h, ...?extraHeaders}, body: body),
      timeout: timeout,
    );
  }

  static Future<http.Response> delete(
    Uri uri, {
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      (h) => http.delete(uri, headers: {...h, ...?extraHeaders}),
      timeout: timeout,
    );
  }

  // ── Internal plumbing ──────────────────────────────────────────────────────

  static Future<Map<String, String>> _buildHeaders([
    Map<String, String>? extra,
  ]) async {
    final token = await _storage.read(key: _tokenKey);
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      ...?extra,
    };
  }

  /// Sends a request built by [factory] (which receives fresh headers).
  /// On 401, attempts a silent token refresh and retries once.
  /// Only broadcasts [onSessionExpired] when refresh also fails.
  static Future<http.Response> _send(
    Future<http.Response> Function(Map<String, String> headers) factory, {
    Duration? timeout,
    bool isRetry = false,
  }) async {
    final headers = await _buildHeaders();
    try {
      final response = await factory(headers).timeout(timeout ?? _defaultTimeout);
      if (response.statusCode == 401 && !isRetry) {
        // Another request is already refreshing — don't pile on, just expire.
        if (_isRefreshing) {
          _sessionExpiredCtrl.add(null);
          return response;
        }
        _isRefreshing = true;
        try {
          final auth = AuthService();
          final newToken = await auth.tryRefreshToken();
          if (newToken != null) {
            // Retry with fresh token now stored in secure storage.
            return _send(factory, timeout: timeout, isRetry: true);
          } else {
            _sessionExpiredCtrl.add(null);
            return response;
          }
        } finally {
          _isRefreshing = false;
        }
      }
      return response;
    } on TimeoutException {
      throw const ApiTimeoutException();
    } on SocketException catch (e) {
      throw ApiNetworkException(e.message);
    } on http.ClientException catch (e) {
      throw ApiNetworkException(e.message);
    }
  }

  // ── JSON helpers ───────────────────────────────────────────────────────────

  static Map<String, dynamic>? tryDecodeJson(http.Response response) {
    try {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is Map<String, dynamic>) return decoded;
      return null;
    } catch (_) {
      return null;
    }
  }

  static String extractApiMessage(
    http.Response response, {
    required String fallback,
  }) {
    final map = tryDecodeJson(response);
    if (map == null) return fallback;
    final m = map['message'];
    if (m != null && m.toString().trim().isNotEmpty) return m.toString();
    final err = map['error'];
    if (err is String && err.trim().isNotEmpty) return err;
    return fallback;
  }
}

// ── Exception hierarchy ────────────────────────────────────────────────────

sealed class ApiException implements Exception {
  const ApiException();
}

class ApiNetworkException extends ApiException {
  final String detail;
  const ApiNetworkException(this.detail);
  @override
  String toString() => 'Sin conexión o error de red: $detail';
}

class ApiTimeoutException extends ApiException {
  const ApiTimeoutException();
  @override
  String toString() => 'La solicitud tardó demasiado. Verifica tu conexión.';
}

class ApiServerException extends ApiException {
  final int statusCode;
  final String message;
  const ApiServerException(this.statusCode, this.message);
  @override
  String toString() => 'Error del servidor ($statusCode): $message';
}

class ApiUnauthorizedException extends ApiException {
  const ApiUnauthorizedException();
  @override
  String toString() => 'Sesión expirada. Inicia sesión de nuevo.';
}

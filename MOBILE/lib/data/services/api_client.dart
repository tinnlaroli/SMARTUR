import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// Centralized HTTP client for all SMARTUR API calls.
///
/// Responsibilities:
/// - Injects Authorization header on every request.
/// - Broadcasts [onSessionExpired] when any endpoint returns 401.
/// - Classifies network errors into [ApiException] subtypes.
/// - Enforces a consistent default timeout.
class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _defaultTimeout = Duration(seconds: 20);

  // ── Session-expired broadcast ──────────────────────────────────────────────

  static final _sessionExpiredCtrl = StreamController<void>.broadcast();

  /// Emits whenever any request returns HTTP 401.
  /// Listen once at the app root and navigate to WelcomeScreen.
  static Stream<void> get onSessionExpired => _sessionExpiredCtrl.stream;

  // ── Public HTTP helpers ────────────────────────────────────────────────────

  static Future<http.Response> get(
    Uri uri, {
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      () async => http.get(uri, headers: await _buildHeaders(extraHeaders)),
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
      () async => http.post(
        uri,
        headers: await _buildHeaders(extraHeaders),
        body: body,
      ),
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
      () async => http.patch(
        uri,
        headers: await _buildHeaders(extraHeaders),
        body: body,
      ),
      timeout: timeout,
    );
  }

  static Future<http.Response> delete(
    Uri uri, {
    Map<String, String>? extraHeaders,
    Duration? timeout,
  }) {
    return _send(
      () async => http.delete(uri, headers: await _buildHeaders(extraHeaders)),
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

  static Future<http.Response> _send(
    Future<http.Response> Function() fn, {
    Duration? timeout,
  }) async {
    try {
      final response = await fn().timeout(timeout ?? _defaultTimeout);
      if (response.statusCode == 401) {
        _sessionExpiredCtrl.add(null);
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

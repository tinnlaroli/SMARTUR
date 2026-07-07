import 'dart:async';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/env_config.dart';
import '../../core/utils/profile_photo_validation.dart';
import 'notification_service.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _biometricKey = 'biometric_enabled';
  static const _biometricDismissedKey = 'biometric_dismissed';
  static const _rememberMeKey = 'remember_me';
  static const _sessionExpiryKey = 'session_expires_at';
  static const _userIdKey = 'user_id';
  static const _userNameKey = 'user_name';
  static const _userEmailKey = 'user_email';
  static const _userPhotoUrlKey = 'user_photo_url';
  static const _userAvatarIconKey = 'user_avatar_icon_key';

  static final _googleSignIn = GoogleSignIn(
    serverClientId: EnvConfig.googleServerClientId,
    scopes: ['email', 'profile'],
  );

  AuthService();

  // Parsea el body de la respuesta — lanza AuthException si el JSON es inválido
  static Map<String, dynamic> _parseBody(http.Response response) {
    try {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } on FormatException {
      throw AuthException('Respuesta del servidor inválida (código ${response.statusCode}).');
    }
  }

  // ── Token persistence ───────────────────────────────────────────────────

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Calls /auth/refresh with the stored refresh token.
  /// Returns the new access token on success, null on failure.
  Future<String?> tryRefreshToken() async {
    final refresh = await _storage.read(key: _refreshTokenKey);
    if (refresh == null) return null;
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.authRefresh}');
      final response = await http
          .post(uri,
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'refreshToken': refresh}))
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final newToken = data['token'] as String?;
        final newRefresh = data['refreshToken'] as String?;
        if (newToken != null) await saveToken(newToken);
        if (newRefresh != null) await saveRefreshToken(newRefresh);
        return newToken;
      }
    } catch (_) {}
    return null;
  }

  Future<bool> hasSession() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null || token.isEmpty) return false;

    // Si no hay expiración guardada, asumimos sesión válida (compatibilidad)
    final rawExpiry = await _storage.read(key: _sessionExpiryKey);
    if (rawExpiry == null) return true;

    final expiryMs = int.tryParse(rawExpiry);
    if (expiryMs == null) return true;

    final nowMs = DateTime.now().millisecondsSinceEpoch;
    if (nowMs > expiryMs) {
      await fullLogout(); // El logout por expiración real sí borra todo
      return false;
    }
    return true;
  }

  /// Verifica el token contra el servidor con un ping ligero.
  /// Si recibe 401 intenta silenciosamente refrescar el token.
  /// Retorna [false] solo si no hay token válido ni refresh posible.
  Future<bool> validateTokenWithServer() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null || token.isEmpty) return false;
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}/me/ping');
      final response = await http
          .get(uri, headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          })
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 401) {
        final newToken = await tryRefreshToken();
        if (newToken == null) {
          await fullLogout();
          return false;
        }
        return true;
      }
      return true;
    } catch (_) {
      // Servidor inaccesible o timeout — no cerrar sesión en modo offline
      return true;
    }
  }

  /// Cierra la sesión en el dispositivo. Si la biometría está activa,
  /// mantenemos el token para permitir el re-ingreso rápido (huella).
  /// Si no hay biometría, borramos el token por seguridad.
  Future<void> clearSession() async {
    final bool biometricOn = await isBiometricEnabled();
    if (!biometricOn) {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _refreshTokenKey);
    }
    await _storage.delete(key: _sessionExpiryKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _userNameKey);
    await _storage.delete(key: _userEmailKey);
    await _storage.delete(key: _userPhotoUrlKey);
    await _storage.delete(key: _userAvatarIconKey);
  }

  Future<void> fullLogout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _biometricKey);
    await _storage.delete(key: _biometricDismissedKey);
    await _storage.delete(key: _rememberMeKey);
    await _storage.delete(key: _sessionExpiryKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _userNameKey);
    await _storage.delete(key: _userEmailKey);
    await _storage.delete(key: _userPhotoUrlKey);
    await _storage.delete(key: _userAvatarIconKey);
    // Permitir que el próximo login vuelva a registrar el token FCM
    NotificationService.reset();
  }

  // ── User data persistence ──────────────────────────────────────────────

  Future<void> saveUserData(Map<String, dynamic> user) async {
    if (user['id'] != null) {
      await _storage.write(key: _userIdKey, value: user['id'].toString());
    }
    if (user['name'] != null) {
      await _storage.write(key: _userNameKey, value: user['name'] as String);
    }
    if (user['email'] != null) {
      await _storage.write(key: _userEmailKey, value: user['email'] as String);
    }
    if (user.containsKey('photo_url')) {
      final v = user['photo_url'];
      if (v == null || (v is String && v.isEmpty)) {
        await _storage.delete(key: _userPhotoUrlKey);
      } else if (v is String) {
        await _storage.write(key: _userPhotoUrlKey, value: v);
      }
    }
    if (user.containsKey('avatar_icon_key')) {
      final v = user['avatar_icon_key'];
      if (v == null || (v is String && v.isEmpty)) {
        await _storage.delete(key: _userAvatarIconKey);
      } else if (v is String) {
        await _storage.write(key: _userAvatarIconKey, value: v);
      }
    }
  }

  Future<String?> getUserPhotoUrl() async => await _storage.read(key: _userPhotoUrlKey);

  Future<String?> getUserAvatarIconKey() async =>
      await _storage.read(key: _userAvatarIconKey);

  Future<int?> getUserId() async {
    final val = await _storage.read(key: _userIdKey);
    if (val != null) return int.tryParse(val);
    return _resolveUserIdFromToken();
  }

  Future<String?> getUserName() async =>
      await _storage.read(key: _userNameKey);

  Future<String?> getUserEmail() async {
    final stored = await _storage.read(key: _userEmailKey);
    if (stored != null) return stored;
    final token = await getToken();
    if (token == null) return null;
    return _decodeTokenPayload(token)?['email'] as String?;
  }

  int? _resolveUserIdFromToken() {
    return null; // will be resolved async
  }

  /// JWT puede decodificar `id` como int, double o (raro) string.
  static int? _parseJwtUserId(dynamic raw) {
    if (raw == null) return null;
    if (raw is int) return raw;
    if (raw is num) return raw.toInt();
    if (raw is String) return int.tryParse(raw);
    return null;
  }

  Future<int?> resolveUserId() async {
    final stored = await _storage.read(key: _userIdKey);
    if (stored != null) return int.tryParse(stored);
    final token = await getToken();
    if (token == null) return null;
    final decoded = _decodeTokenPayload(token);
    final id = _parseJwtUserId(decoded?['id']);
    if (id != null) {
      await _storage.write(key: _userIdKey, value: id.toString());
    }
    return id;
  }

  Map<String, dynamic>? _decodeTokenPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final normalized = base64Url.normalize(parts[1]);
      return jsonDecode(utf8.decode(base64Url.decode(normalized)))
          as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // ── Biometric preference ───────────────────────────────────────────────

  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(key: _biometricKey, value: enabled.toString());
  }

  Future<bool> isBiometricEnabled() async {
    final val = await _storage.read(key: _biometricKey);
    return val == 'true';
  }

  Future<void> setBiometricDismissed(bool dismissed) async {
    await _storage.write(key: _biometricDismissedKey, value: dismissed.toString());
  }

  Future<bool> isBiometricDismissed() async {
    final val = await _storage.read(key: _biometricDismissedKey);
    return val == 'true';
  }

  // ── Remember me / session expiry ─────────────────────────────────────────

  Future<void> setRememberMe(bool remember) async {
    await _storage.write(key: _rememberMeKey, value: remember.toString());
    final now = DateTime.now();
    // rememberMe=true  → 30 días, igual al vencimiento real del refresh token
    // del servidor (refreshTokenHelper.js) — antes eran 7d y el reloj local
    // cerraba sesión antes de que el servidor lo exigiera.
    // rememberMe=false → 24h (fuerza reingreso aunque el refresh siga vivo).
    final expiry = remember
        ? now.add(const Duration(days: 30))
        : now.add(const Duration(hours: 24));
    await _storage.write(
      key: _sessionExpiryKey,
      value: expiry.millisecondsSinceEpoch.toString(),
    );
  }

  Future<bool> isRememberMeEnabled() async {
    final val = await _storage.read(key: _rememberMeKey);
    return val == 'true';
  }

  // ── REGISTRO ────────────────────────────────────────────────────────────

  Future<bool> register(String name, String email, String password) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.register}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"name": name, "email": email, "password": password}),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return true;
    } else {
      final body = _parseBody(response);
      final errorMsg = body['message'] ?? 'Error al registrarse.';
      throw AuthException(errorMsg as String);
    }
  }

  // ── LOGIN PASO 1 (Credenciales) ────────────────────────────────────────

  Future<Map<String, dynamic>?> loginStep1(
      String email, String password) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.login}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"email": email, "password": password}),
    );

    if (response.statusCode == 200) {
      return _parseBody(response);
    }
    if (response.statusCode == 429) {
      throw AuthRateLimitException();
    }
    if (response.statusCode == 409) {
      final body = _parseBody(response);
      if (body['code'] == 'SOCIAL_ACCOUNT') {
        final provider = body['provider'] as String? ?? 'google';
        final label = provider == 'facebook' ? 'Facebook' : 'Google';
        throw SocialAccountException(
          provider,
          'Esta cuenta usa $label — inicia sesión con el botón de $label.',
        );
      }
    }
    // Siempre "credenciales incorrectas" para no revelar si el usuario existe
    throw AuthException('Credenciales incorrectas.');
  }

  /// Reenvía el código de verificación de login sin pedir la contraseña de
  /// nuevo (requiere que ya exista una verificación pendiente del paso 1).
  Future<void> resendLoginOtp(String email) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.resendOtp}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"email": email}),
    );
    if (response.statusCode == 429) {
      throw AuthRateLimitException();
    }
    if (response.statusCode != 200) {
      final body = _parseBody(response);
      throw AuthException(body['message'] as String? ?? 'No se pudo reenviar el código.');
    }
  }

  // ── LOGIN PASO 2 (OTP) ────────────────────────────────────────────────

  Future<String?> verifyOTP(String email, String otpCode, {bool rememberMe = false}) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.twoFactor}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"email": email, "token": otpCode}),
    );

    if (response.statusCode == 200) {
      final data = _parseBody(response);
      final String? token = data['token'] as String?;
      final String? refresh = data['refreshToken'];
      if (token != null) await saveToken(token);
      if (refresh != null) await saveRefreshToken(refresh);
      await setRememberMe(rememberMe);
      if (data['user'] != null) {
        await saveUserData(data['user'] as Map<String, dynamic>);
      }
      return token;
    }
    if (response.statusCode == 429) {
      throw AuthRateLimitException();
    }
    return null;
  }

  // ── LOGIN Google ───────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> loginWithGoogle({bool rememberMe = false}) async {
    try {
      // Limpiar credential cacheado para forzar selector de cuenta
      try { await _googleSignIn.signOut(); } catch (_) {}

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) throw AuthCancelledException();

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        throw AuthException('No se pudo obtener la identidad de Google.');
      }

      final url = Uri.parse('${ApiConstants.baseUrl}/google-login');

      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({"idToken": idToken}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? token = data['token'];
        final String? refresh = data['refreshToken'];
        if (token != null) await saveToken(token);
        if (refresh != null) await saveRefreshToken(refresh);
        await setRememberMe(rememberMe);
        if (data['user'] != null) {
          await saveUserData(data['user'] as Map<String, dynamic>);
        }
        return data;
      } else if (response.statusCode == 401) {
        throw AuthException(
            'Tu sesión de Google ha expirado. Por favor, intenta de nuevo.');
      } else if (response.statusCode == 400) {
        final errorMsg = jsonDecode(response.body)['message'] ??
            'Hubo un error con los datos de tu cuenta de Google.';
        throw AuthException('Error de validación: $errorMsg');
      } else {
        throw AuthException(
            'El servidor no responde (${response.statusCode}). Por favor, intenta más tarde.');
      }
    } on AuthCancelledException {
      rethrow;
    } on TimeoutException {
      throw AuthException(
          'La conexión tardó demasiado. Verifica tu internet.',
          code: 'auth.timeout',
        );
    } on PlatformException catch (e) {
      final msg = (e.message ?? '').toLowerCase();
      final isConfig = e.code == 'sign_in_failed' ||
          msg.contains('developer_error') ||
          msg.contains('10') ||
          msg.contains('12500');
      throw AuthException(
        isConfig
            ? 'Google Sign-In no está configurado para esta versión de la app. '
                'Registra el SHA del keystore de release en Firebase (ver docs/GOOGLE_SIGNIN_RELEASE.md).'
            : 'Error de Google: ${e.message ?? e.code}',
        code: isConfig ? 'auth.google_release_config' : 'auth.google_platform',
      );
    } catch (error) {
      if (error is AuthException) rethrow;
      final text = error.toString().toLowerCase();
      if (text.contains('developer_error') || text.contains('sign_in_failed')) {
        throw AuthException(
          'Google Sign-In no está configurado para esta versión de la app. '
              'Registra el SHA del keystore de release en Firebase.',
          code: 'auth.google_release_config',
        );
      }
      throw AuthException('Error inesperado: $error', code: 'auth.google_unknown');
    }
  }

  // ── LOGIN Facebook ─────────────────────────────────────────────────────
  //
  // Requiere que el proyecto tenga configurado el SDK nativo de Facebook
  // (FACEBOOK_APP_ID/CLIENT_TOKEN en AndroidManifest.xml / Info.plist) y el
  // backend con FACEBOOK_APP_ID/FACEBOOK_APP_SECRET — ver API/.env.example.
  // Sin esa configuración, el backend responde 501 y aquí se traduce a un
  // mensaje amable en vez de un error confuso.

  Future<Map<String, dynamic>?> loginWithFacebook({bool rememberMe = false}) async {
    try {
      final LoginResult result = await FacebookAuth.instance.login(
        permissions: const ['email', 'public_profile'],
      );

      if (result.status == LoginStatus.cancelled) {
        throw AuthCancelledException();
      }
      if (result.status != LoginStatus.success || result.accessToken == null) {
        throw AuthException(
            result.message ?? 'No se pudo iniciar sesión con Facebook.');
      }

      final url = Uri.parse('${ApiConstants.baseUrl}/facebook-login');
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({"accessToken": result.accessToken!.tokenString}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? token = data['token'];
        final String? refresh = data['refreshToken'];
        if (token != null) await saveToken(token);
        if (refresh != null) await saveRefreshToken(refresh);
        await setRememberMe(rememberMe);
        if (data['user'] != null) {
          await saveUserData(data['user'] as Map<String, dynamic>);
        }
        return data;
      } else if (response.statusCode == 501) {
        throw AuthException(
          'Inicio de sesión con Facebook no disponible por ahora.',
          code: 'auth.facebook_unavailable',
        );
      } else if (response.statusCode == 401) {
        throw AuthException(
            'Tu sesión de Facebook ha expirado. Por favor, intenta de nuevo.');
      } else {
        throw AuthException(
            'El servidor no responde (${response.statusCode}). Por favor, intenta más tarde.');
      }
    } on AuthCancelledException {
      rethrow;
    } on AuthException {
      rethrow;
    } on TimeoutException {
      throw AuthException(
        'La conexión tardó demasiado. Verifica tu internet.',
        code: 'auth.timeout',
      );
    } catch (error) {
      throw AuthException('Error inesperado: $error', code: 'auth.facebook_unknown');
    }
  }

  // ── Forgot / Reset Password ────────────────────────────────────────────

  Future<void> forgotPassword(String email) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.forgot}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"email": email}),
    );
    if (response.statusCode != 200) {
      final msg = jsonDecode(response.body)['message'] ??
          'Error al enviar código de verificación';
      throw AuthException(msg);
    }
  }

  Future<void> resetPassword(
      String email, String code, String newPassword) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.reset}');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(
          {"email": email, "token": code, "newPassword": newPassword}),
    );
    if (response.statusCode != 200) {
      final msg = jsonDecode(response.body)['message'] ??
          'Error al restablecer contraseña';
      throw AuthException(msg);
    }
  }

  // ── User Profile (GET / PATCH) ─────────────────────────────────────────

  Future<Map<String, dynamic>?> getUserProfile() async {
    final userId = await resolveUserId();
    final token = await getToken();
    if (userId == null || token == null) return null;

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.users}/$userId');
    try {
      final response = await http
          .get(url, headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          })
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final user = data['user'] as Map<String, dynamic>?;
        if (user != null) await saveUserData(user);
        return user;
      }
      return null;
    } on TimeoutException {
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> updateUser(
      Map<String, dynamic> updates) async {
    final userId = await resolveUserId();
    final token = await getToken();
    if (userId == null || token == null) return null;

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.users}/$userId');
    final response = await http.patch(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(updates),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final user = data['user'] as Map<String, dynamic>?;
      if (user != null) await saveUserData(user);
      return user;
    } else {
      final msg =
          jsonDecode(response.body)['message'] ?? 'Error al actualizar perfil';
      throw AuthException(msg);
    }
  }

  Future<void> deactivateAccount() async {
    await updateUser({"is_active": false});
    await fullLogout();
  }

  /// Sube imagen de perfil (multipart, campo `avatar`). Requiere Cloudinary en el API.
  /// [platformMime] es el que reporta `image_picker` (XFile.mimeType), si existe.
  Future<Map<String, dynamic>?> uploadAvatarImage(
    Uint8List bytes,
    String filename, {
    String? platformMime,
  }) async {
    final userId = await resolveUserId();
    final token = await getToken();
    if (userId == null || token == null) {
      throw AuthException('Sesión no válida. Inicia sesión de nuevo.');
    }

    final issue = ProfilePhotoValidation.validate(
      bytes: bytes,
      filename: filename,
      platformMime: platformMime,
    );
    if (issue == ProfilePhotoIssue.tooLarge) {
      throw AuthException('La imagen supera 5 MB.');
    }
    if (issue == ProfilePhotoIssue.invalidFormat) {
      throw AuthException(
        'Formato no permitido. Usa JPEG, PNG, GIF, WebP o HEIC.',
      );
    }

    final mime = ProfilePhotoValidation.detectMimeType(
      bytes: bytes,
      filename: filename,
      platformMime: platformMime,
    )!;
    final safeName = ProfilePhotoValidation.effectiveFilename(filename, mime);

    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.users}/$userId/avatar');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(
      http.MultipartFile.fromBytes(
        'avatar',
        bytes,
        filename: safeName,
        contentType: MediaType.parse(mime),
      ),
    );
    final streamed = await request.send().timeout(const Duration(seconds: 60));
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      final user = data['user'] as Map<String, dynamic>?;
      if (user != null) await saveUserData(user);
      return user;
    }
    final msg = _parseApiMessage(response.bodyBytes);
    throw AuthException(msg);
  }

  static String _parseApiMessage(Uint8List bodyBytes) {
    try {
      final map = jsonDecode(utf8.decode(bodyBytes)) as Map<String, dynamic>?;
      final m = map?['message'];
      if (m != null && m.toString().isNotEmpty) return m.toString();
    } catch (_) {}
    return 'Error al subir imagen';
  }

  // ── Session management ─────────────────────────────────────────────────

  /// Returns up to 10 active (non-revoked, non-expired) sessions for the current user.
  Future<List<Map<String, dynamic>>> fetchSessions() async {
    final token = await getToken();
    if (token == null) return [];
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.meSessions}');
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final list = jsonDecode(utf8.decode(response.bodyBytes)) as List?;
      return list?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [];
    }
    return [];
  }

  /// Revokes a session by ID. Returns true on success.
  Future<bool> revokeSession(int sessionId) async {
    final token = await getToken();
    if (token == null) return false;
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.meSessions}/$sessionId');
    final response = await http.delete(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    ).timeout(const Duration(seconds: 10));
    return response.statusCode == 200;
  }

  // ── Login por QR (aprobar sesión web desde el móvil) ───────────────────

  /// Aprueba el inicio de sesión web cuyo QR fue escaneado. [challengeId] y
  /// [rawToken] vienen de decodificar el QR ("challengeId:rawToken").
  Future<void> approveQrLogin(int challengeId, String rawToken) async {
    final token = await getToken();
    if (token == null) throw AuthException('Sesión expirada.');
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.authQr}/$challengeId/approve');
    final response = await http
        .post(
          uri,
          headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
          body: jsonEncode({'token': rawToken}),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      final body = _parseBody(response);
      throw AuthException(body['message'] as String? ?? 'No se pudo autorizar el inicio de sesión.');
    }
  }

  /// Rechaza el inicio de sesión web escaneado.
  Future<void> denyQrLogin(int challengeId, String rawToken) async {
    final token = await getToken();
    if (token == null) return;
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.authQr}/$challengeId/deny');
    await http
        .post(
          uri,
          headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
          body: jsonEncode({'token': rawToken}),
        )
        .timeout(const Duration(seconds: 10));
  }
}

// ── Custom Exceptions ────────────────────────────────────────────────────

class AuthException implements Exception {
  final String message;
  final String code;
  AuthException(this.message, {this.code = 'auth.unknown'});
  @override
  String toString() => message;
}

class AuthCancelledException extends AuthException {
  AuthCancelledException()
      : super(
          'Inicio de sesión cancelado por el usuario',
          code: 'auth.cancelled',
        );
}

/// La cuenta se creó vía un proveedor social (Google/Facebook) y no tiene
/// una contraseña utilizable — el usuario debe entrar con ese proveedor.
class SocialAccountException extends AuthException {
  final String provider;
  SocialAccountException(this.provider, String message)
      : super(message, code: 'auth.social_account');
}

/// Thrown when the API returns 429 (rate limit exceeded).
/// Show only when attempts are exhausted, not "X attempts remaining".
class AuthRateLimitException extends AuthException {
  AuthRateLimitException()
      : super(
          'Demasiados intentos. Intenta de nuevo en 1 minuto.',
          code: 'auth.rate_limited',
        );
}
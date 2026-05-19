import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../../core/constants/api_constants.dart';
import '../../core/utils/profile_photo_validation.dart';
import 'auth_service.dart';

class UserContentException implements Exception {
  final String message;
  UserContentException(this.message);
  @override
  String toString() => message;
}

/// Extrae mensaje legible de respuestas JSON del API (message, error, errors).
String _apiErrorMessageFromBody(String body, {required String fallback}) {
  try {
    final dynamic map = jsonDecode(body);
    if (map is Map) {
      final m = map['message'];
      if (m != null && m.toString().trim().isNotEmpty) {
        return m.toString();
      }
      final err = map['error'];
      if (err is String && err.trim().isNotEmpty) return err;
      if (err is Map && err['message'] != null) {
        return err['message'].toString();
      }
      final errs = map['errors'];
      if (errs is List && errs.isNotEmpty) {
        return errs.first.toString();
      }
    }
  } catch (_) {}
  final t = body.trim();
  if (t.isNotEmpty && t.length < 240 && !t.startsWith('<')) {
    return t;
  }
  return fallback;
}

String _networkFailureMessage(Object e) {
  final s = e.toString().toLowerCase();
  if (s.contains('socketexception') ||
      s.contains('failed host lookup') ||
      s.contains('connection refused') ||
      s.contains('network is unreachable')) {
    return 'No hay conexión o no se alcanza el servidor. Comprueba la URL del API (emulador: 10.0.2.2 en lugar de localhost).';
  }
  if (s.contains('clientexception') || s.contains('handshakeexception')) {
    return 'Error de red o certificado SSL al contactar el servidor.';
  }
  return 'Error de red al publicar.';
}

/// Favoritos, historial de visitas y comunidad (API v2).
class UserContentService {
  final AuthService _auth = AuthService();

  /// Une `place` anidado y alias típicos del backend para la UI del diario.
  static Map<String, dynamic> normalizeDiaryPlaceRow(Map<String, dynamic> raw) {
    final out = Map<String, dynamic>.from(raw);
    final place = raw['place'];
    if (place is Map) {
      final p = Map<String, dynamic>.from(place);
      for (final e in p.entries) {
        final v = e.value;
        if (v == null) continue;
        if (!out.containsKey(e.key) || out[e.key] == null ||
            (out[e.key] is String && (out[e.key] as String).isEmpty)) {
          out[e.key] = v;
        }
      }
    }
    out['place_kind'] ??= raw['placeKind']?.toString();
    out['place_id'] ??= raw['placeId'];
    if (out['name'] == null || out['name'].toString().trim().isEmpty) {
      out['name'] = out['title'] ?? out['nombre'] ?? '';
    }
    final img = out['image_url']?.toString();
    if (img == null || img.isEmpty) {
      out['image_url'] = out['imageUrl'] ??
          out['photo_url'] ??
          out['cover_image'] ??
          out['thumbnail_url'] ??
          '';
    }
    return out;
  }

  static List<Map<String, dynamic>> _parseObjectList(Map<String, dynamic> data, List<String> keys) {
    for (final k in keys) {
      final v = data[k];
      if (v is List) {
        return v.map((e) {
          if (e is! Map) return <String, dynamic>{};
          return normalizeDiaryPlaceRow(Map<String, dynamic>.from(e));
        }).toList();
      }
      if (v is Map) {
        final inner = Map<String, dynamic>.from(v);
        for (final ik in const ['favorites', 'items', 'rows', 'data']) {
          final iv = inner[ik];
          if (iv is List) {
            return iv.map((e) {
              if (e is! Map) return <String, dynamic>{};
              return normalizeDiaryPlaceRow(Map<String, dynamic>.from(e));
            }).toList();
          }
        }
      }
    }
    return [];
  }

  Future<Map<String, String>> _headers() async {
    final token = await _auth.getToken();
    if (token == null) throw UserContentException('Sin sesión');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<List<Map<String, dynamic>>> fetchFavorites() async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.meFavorites}');
    final response =
        await http.get(uri, headers: await _headers()).timeout(const Duration(seconds: 20));
    if (response.statusCode != 200) {
      throw UserContentException('No se pudieron cargar favoritos');
    }
    final decoded = jsonDecode(response.body);
    if (decoded is List) {
      return decoded.map((e) {
        if (e is! Map) return <String, dynamic>{};
        return normalizeDiaryPlaceRow(Map<String, dynamic>.from(e));
      }).toList();
    }
    if (decoded is! Map<String, dynamic>) {
      return [];
    }
    final data = Map<String, dynamic>.from(decoded);
    var list = _parseObjectList(data, const ['favorites', 'data', 'items', 'results']);
    if (list.isEmpty) {
      final d = data['data'];
      if (d is Map<String, dynamic>) {
        list = _parseObjectList(d, const ['favorites', 'items', 'rows']);
      }
    }
    return list;
  }

  Future<void> addFavorite(String placeKind, int placeId) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.meFavorites}');
    final response = await http
        .post(
          uri,
          headers: await _headers(),
          body: jsonEncode({'place_kind': placeKind, 'place_id': placeId}),
        )
        .timeout(const Duration(seconds: 15));
    if (response.statusCode != 201 && response.statusCode != 200) {
      final msg = jsonDecode(response.body)['message'] ?? 'Error al guardar favorito';
      throw UserContentException(msg.toString());
    }
  }

  Future<void> removeFavorite(String placeKind, int placeId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.meFavorites}/$placeKind/$placeId');
    final response =
        await http.delete(uri, headers: await _headers()).timeout(const Duration(seconds: 15));
    if (response.statusCode != 200) {
      throw UserContentException('No se pudo quitar el favorito');
    }
  }

  Future<List<Map<String, dynamic>>> fetchVisits({int limit = 50}) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.meVisits}?limit=$limit');
    final response =
        await http.get(uri, headers: await _headers()).timeout(const Duration(seconds: 20));
    if (response.statusCode != 200) {
      throw UserContentException('No se pudo cargar el historial');
    }
    final decoded = jsonDecode(response.body);
    if (decoded is List) {
      return decoded.map((e) {
        if (e is! Map) return <String, dynamic>{};
        return normalizeDiaryPlaceRow(Map<String, dynamic>.from(e));
      }).toList();
    }
    if (decoded is! Map<String, dynamic>) {
      return [];
    }
    final data = Map<String, dynamic>.from(decoded);
    var list = _parseObjectList(data, const ['visits', 'data', 'items', 'results']);
    if (list.isEmpty) {
      final d = data['data'];
      if (d is Map<String, dynamic>) {
        list = _parseObjectList(d, const ['visits', 'items', 'rows']);
      }
    }
    return list;
  }

  Future<void> recordVisit(String placeKind, int placeId) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.meVisits}');
    try {
      await http
          .post(
            uri,
            headers: await _headers(),
            body: jsonEncode({'place_kind': placeKind, 'place_id': placeId}),
          )
          .timeout(const Duration(seconds: 10));
    } catch (_) {
      // No bloquear UX si falla el registro de visita
    }
  }

  static bool _samePlaceRef(Map<String, dynamic> e, String placeKind, int placeId) {
    final k = e['place_kind']?.toString();
    final raw = e['place_id'];
    final id = raw is int ? raw : int.tryParse(raw?.toString() ?? '');
    return k == placeKind && id == placeId;
  }

  Future<bool> isFavorite(String placeKind, int placeId) async {
    try {
      final list = await fetchFavorites();
      return list.any((e) => _samePlaceRef(e, placeKind, placeId));
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> fetchCommunityPosts({int page = 1, int limit = 20}) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.communityPosts}?page=$page&limit=$limit');
    final response = await http.get(uri).timeout(const Duration(seconds: 20));
    if (response.statusCode != 200) {
      throw UserContentException('No se pudieron cargar las publicaciones');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<void> deleteCommunityPost(int postId) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.communityPosts}/$postId');
    try {
      final response = await http.delete(uri, headers: await _headers()).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) {
        var fallback = 'No se pudo eliminar la publicación';
        if (response.statusCode == 404) fallback = 'Publicación no encontrada o sin permisos';
        final msg = _apiErrorMessageFromBody(response.body, fallback: fallback);
        throw UserContentException(msg);
      }
    } on TimeoutException {
      throw UserContentException('Tiempo de espera agotado al eliminar.');
    } catch (e) {
      if (e is UserContentException) rethrow;
      throw UserContentException(_networkFailureMessage(e));
    }
  }

  /// Publicación multipart: lugar obligatorio; texto y/o imagen.
  ///
  /// Misma forma que curl: `multipart/form-data` con campos `place_kind`, `place_id`,
  /// `caption` (puede ir vacío si hay `photo`) y archivo opcional con nombre de campo **`photo`**.
  /// No se debe fijar `Content-Type` manualmente; [http.MultipartRequest] añade el boundary.
  Future<void> createCommunityPost({
    required String placeKind,
    required int placeId,
    required String caption,
    Uint8List? imageBytes,
    String? imageFilename,
    String? imageMimeType,
  }) async {
    final rawToken = await _auth.getToken();
    final token = rawToken?.trim();
    if (token == null || token.isEmpty) {
      throw UserContentException('Sin sesión');
    }

    final trimmed = caption.trim();
    if (trimmed.isEmpty && (imageBytes == null || imageBytes.isEmpty)) {
      throw UserContentException('Escribe un texto o adjunta una imagen');
    }

    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.communityPosts}');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'application/json';
    // Orden alineado con ejemplos del API (multer + body en texto)
    request.fields['place_kind'] = placeKind;
    request.fields['place_id'] = '$placeId';
    request.fields['caption'] = trimmed;

    if (imageBytes != null && imageBytes.isNotEmpty) {
      final fn = imageFilename ?? 'photo.jpg';
      final issue = ProfilePhotoValidation.validate(
        bytes: imageBytes,
        filename: fn,
        platformMime: imageMimeType,
      );
      if (issue == ProfilePhotoIssue.tooLarge) {
        throw UserContentException('La imagen supera 5 MB.');
      }
      if (issue == ProfilePhotoIssue.invalidFormat) {
        throw UserContentException(
          'Formato no permitido. Usa JPEG, PNG, GIF, WebP o HEIC.',
        );
      }
      final mime = ProfilePhotoValidation.detectMimeType(
        bytes: imageBytes,
        filename: fn,
        platformMime: imageMimeType,
      );
      if (mime == null) {
        throw UserContentException('No se pudo detectar el tipo de imagen.');
      }
      final safeName = ProfilePhotoValidation.effectiveFilename(fn, mime);
      request.files.add(
        http.MultipartFile.fromBytes(
          'photo',
          imageBytes,
          filename: safeName,
          contentType: MediaType.parse(mime),
        ),
      );
    }

    try {
      final streamed =
          await request.send().timeout(const Duration(seconds: 90));
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode == 201) return;

      var fallback = 'Error al publicar';
      final sc = response.statusCode;
      if (sc == 400) {
        fallback = 'Datos no válidos.';
      } else if (sc == 401) {
        fallback = 'Sesión no válida. Inicia sesión de nuevo.';
      } else if (sc == 404) {
        fallback = 'Lugar no encontrado en el servidor.';
      } else if (sc == 413) {
        fallback = 'La imagen o la petición es demasiado grande.';
      } else if (sc == 500 || sc == 502 || sc == 503) {
        fallback = 'El servidor no pudo crear la publicación. Inténtalo más tarde.';
      }
      final msg = _apiErrorMessageFromBody(
        response.body,
        fallback: fallback,
      );
      throw UserContentException(msg);
    } on TimeoutException catch (_) {
      throw UserContentException(
        'Tiempo de espera agotado. Comprueba tu conexión y que el API responda.',
      );
    } on UserContentException {
      rethrow;
    } catch (e) {
      throw UserContentException(_networkFailureMessage(e));
    }
  }
}

import 'dart:convert';

import '../../core/constants/api_constants.dart';
import '../models/itinerary_model.dart';
import '../models/user_profile_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class SocialService {
  // ─── User search ───────────────────────────────────────────────────────────

  Future<List<UserProfile>> searchUsers(String q) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.usersSearch}?q=${Uri.encodeComponent(q)}');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['users'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(UserProfile.fromJson)
        .toList();
  }

  // ─── Public profile ────────────────────────────────────────────────────────

  Future<UserProfile?> getPublicProfile(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/profile');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 404) return null;
    if (res.statusCode != 200) throw SocialException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return UserProfile.fromJson(data['profile'] as Map<String, dynamic>);
  }

  // ─── User public itineraries ───────────────────────────────────────────────

  Future<List<Itinerary>> getUserItineraries(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/itineraries');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  // ─── Follow / Unfollow ─────────────────────────────────────────────────────

  Future<void> followUser(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/follow');
    final res = await ApiClient.post(uri, body: jsonEncode({}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
  }

  Future<void> unfollowUser(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/follow');
    final res = await ApiClient.delete(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
  }

  // ─── Followers / Following lists ───────────────────────────────────────────

  Future<List<UserProfile>> getFollowers(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/followers');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['users'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(UserProfile.fromJson)
        .toList();
  }

  Future<List<UserProfile>> getFollowing(int userId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/following');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw SocialException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['users'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(UserProfile.fromJson)
        .toList();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  String _msg(dynamic res) => ApiClient.extractApiMessage(
        res,
        fallback: 'Error de servidor (${res.statusCode})',
      );
}

class SocialException implements Exception {
  final String message;
  SocialException(this.message);
  @override
  String toString() => message;
}

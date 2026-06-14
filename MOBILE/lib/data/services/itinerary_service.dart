import 'dart:convert';

import '../../core/constants/api_constants.dart';
import '../models/itinerary_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class ItineraryService {
  // ─── My itineraries ────────────────────────────────────────────────────────

  Future<List<Itinerary>> fetchMyItineraries() async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.itinerariesMe}');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  Future<Itinerary> createItinerary({
    required String title,
    String? description,
    bool isPublic = false,
  }) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.itineraries}');
    final res = await ApiClient.post(uri, body: jsonEncode({
      'title': title,
      if (description != null) 'description': description,
      'is_public': isPublic,
    }));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 201) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return Itinerary.fromJson(data['itinerary'] as Map<String, dynamic>);
  }

  Future<Itinerary?> updateItinerary(
    int id, {
    String? title,
    String? description,
    bool? isPublic,
    DateTime? startDate,
    DateTime? endDate,
    bool clearStartDate = false,
    bool clearEndDate = false,
  }) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id');
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (description != null) body['description'] = description;
    if (isPublic != null) body['is_public'] = isPublic;
    if (startDate != null) body['start_date'] = startDate.toIso8601String().split('T')[0];
    if (clearStartDate) body['start_date'] = null;
    if (endDate != null) body['end_date'] = endDate.toIso8601String().split('T')[0];
    if (clearEndDate) body['end_date'] = null;
    final res = await ApiClient.patch(uri, body: jsonEncode(body));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 404) return null;
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return Itinerary.fromJson(data['itinerary'] as Map<String, dynamic>);
  }

  Future<void> deleteItinerary(int id) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id');
    final res = await ApiClient.delete(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
  }

  // ─── By ID ─────────────────────────────────────────────────────────────────

  Future<Itinerary?> fetchById(int id) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 404 || res.statusCode == 403) return null;
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return Itinerary.fromJson(data['itinerary'] as Map<String, dynamic>);
  }

  // ─── Public feeds ──────────────────────────────────────────────────────────

  Future<List<Itinerary>> fetchPredefined() async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itinerariesPredefined}');
    final res = await ApiClient.get(uri);
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  Future<List<Itinerary>> fetchFollowing() async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itinerariesFollowing}');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  Future<List<Itinerary>> fetchCommunity() async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itinerariesCommunity}');
    final res = await ApiClient.get(uri);
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  Future<List<Itinerary>> search(String q) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itinerariesSearch}?q=${Uri.encodeComponent(q)}');
    final res = await ApiClient.get(uri);
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return (data['itineraries'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Itinerary.fromJson)
        .toList();
  }

  // ─── Stops ─────────────────────────────────────────────────────────────────

  Future<ItineraryStop> addStop(
    int itineraryId, {
    required String placeKind,
    required int placeId,
    DateTime? visitDate,
    String? visitTimeStart,
    String? notes,
  }) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$itineraryId/stops');
    final res = await ApiClient.post(uri, body: jsonEncode({
      'place_kind': placeKind,
      'place_id': placeId,
      if (visitDate != null)
        'visit_date': visitDate.toIso8601String().substring(0, 10),
      if (visitTimeStart != null) 'visit_time_start': visitTimeStart,
      if (notes != null) 'notes': notes,
    }));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 201) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return ItineraryStop.fromJson({
      ...data['stop'] as Map<String, dynamic>,
      'id_itinerary': itineraryId,
    });
  }

  Future<void> deleteStop(int itineraryId, int stopId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$itineraryId/stops/$stopId');
    final res = await ApiClient.delete(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
  }

  Future<void> reorderStops(int itineraryId, List<int> orderedIds) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$itineraryId/stops/reorder');
    final res = await ApiClient.patch(uri, body: jsonEncode({'ordered_ids': orderedIds}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
  }

  Future<void> updateStop(
    int itineraryId,
    int stopId, {
    DateTime? visitDate,
    String? visitTimeStart,
    String? notes,
  }) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$itineraryId/stops/$stopId');
    final body = <String, dynamic>{};
    if (visitDate != null) body['visit_date'] = visitDate.toIso8601String().substring(0, 10);
    if (visitTimeStart != null) body['visit_time_start'] = visitTimeStart;
    if (notes != null) body['notes'] = notes;
    if (body.isEmpty) return;
    final res = await ApiClient.patch(uri, body: jsonEncode(body));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
  }

  Future<Map<String, dynamic>> fetchNearbyForRoute(int itineraryId) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$itineraryId/suggest-nearby');
    final res = await ApiClient.get(uri, timeout: const Duration(seconds: 10));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
  }

  // ─── Social ────────────────────────────────────────────────────────────────

  Future<Itinerary> copyItinerary(int id) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id/copy');
    final res = await ApiClient.post(uri, body: jsonEncode({}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 201) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return Itinerary.fromJson(data['itinerary'] as Map<String, dynamic>);
  }

  Future<OptimizeResult> optimizeItinerary(int id) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id/optimize');
    final res = await ApiClient.post(uri, body: jsonEncode({}));
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 403) throw ItineraryException('Acceso denegado');
    if (res.statusCode == 422) {
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      throw ItineraryException(data['message'] as String? ?? 'Paradas insuficientes');
    }
    if (res.statusCode != 200) throw ItineraryException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return OptimizeResult.fromJson(data);
  }

  Future<void> likeItinerary(int id) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id/like');
    await ApiClient.post(uri, body: {});
  }

  Future<void> unlikeItinerary(int id) async {
    final uri = Uri.parse(
        '${ApiConstants.baseUrl}${ApiConstants.itineraries}/$id/like');
    await ApiClient.delete(uri);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  String _msg(dynamic res) => ApiClient.extractApiMessage(
        res,
        fallback: 'Error de servidor (${res.statusCode})',
      );
}

class ItineraryException implements Exception {
  final String message;
  ItineraryException(this.message);
  @override
  String toString() => message;
}

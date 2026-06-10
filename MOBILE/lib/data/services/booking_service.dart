import 'dart:convert';
import '../../core/constants/api_constants.dart';
import '../models/booking_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class BookingException implements Exception {
  final String message;
  BookingException(this.message);
  @override
  String toString() => message;
}

class BookingService {
  String _msg(dynamic res) {
    try {
      final d = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      return d['message'] as String? ?? 'Error ${res.statusCode}';
    } catch (_) {
      return 'Error ${res.statusCode}';
    }
  }

  Future<Booking> createBooking({
    required int serviceId,
    required DateTime visitDate,
    String? visitTime,
    int guests = 1,
    String? notes,
  }) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.bookings}');
    final body = jsonEncode({
      'id_service': serviceId,
      'visit_date': visitDate.toIso8601String().substring(0, 10),
      if (visitTime != null) 'visit_time': visitTime,
      'guests': guests,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    final res = await ApiClient.post(uri, body: body);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode == 201 || res.statusCode == 200) {
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      return Booking.fromJson(data['booking'] as Map<String, dynamic>? ?? data);
    }
    throw BookingException(_msg(res));
  }

  Future<List<Booking>> fetchMyBookings() async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.bookingsMe}');
    final res = await ApiClient.get(uri);
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw BookingException(_msg(res));
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    final list = data['bookings'] as List<dynamic>? ?? [];
    return list.map((e) => Booking.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> cancelBooking(int id) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.bookings}/$id/cancel');
    final res = await ApiClient.patch(uri, body: '{}');
    if (res.statusCode == 401) throw AuthException('Sesión expirada');
    if (res.statusCode != 200) throw BookingException(_msg(res));
  }
}

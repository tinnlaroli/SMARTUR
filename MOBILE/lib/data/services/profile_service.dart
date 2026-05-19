import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/api_constants.dart';
import 'auth_service.dart';

class ProfileService {
  static const _prefsKey = 'preferences_saved';

  /// Retorna true si el usuario ya guardó sus preferencias previamente (caché local).
  static Future<bool> hasPreferencesSaved() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefsKey) ?? false;
  }

  /// Guarda la bandera local indicando que las preferencias ya fueron enviadas.
  static Future<void> _markPreferencesSaved() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsKey, true);
  }

  /// Envía las preferencias al backend y marca el guardado local.
  /// Retorna true en éxito, false en caso contrario.
  static Future<bool> savePreferences(
    String token,
    Map<String, dynamic> preferences,
  ) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.preferences}');
    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(preferences),
      );

      if (response.statusCode == 200) {
        await _markPreferencesSaved();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
  /// GET /profiles/me → mapa para rellenar el formulario de preferencias.
  static Future<Map<String, dynamic>> fetchMyProfileForPreferences() async {
    final auth = AuthService();
    final token = await auth.getToken();
    if (token == null) return {};

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.profilesMe}');
    try {
      final response = await http
          .get(
            url,
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) return {};
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final out = <String, dynamic>{};

      final birthDate = data['birthDate'];
      if (birthDate != null && birthDate.toString().isNotEmpty) {
        out['birth_date'] = birthDate.toString();
      }

      final tp = data['travelerProfile'];
      if (tp is! Map<String, dynamic>) return out;

      final age = tp['age'];
      if (age != null) out['age'] = age is int ? age : int.tryParse(age.toString());

      final gender = tp['gender'];
      if (gender != null) out['gender'] = gender.toString();

      final interests = tp['interests'];
      if (interests is List) {
        out['interests'] = interests.map((e) => e.toString()).toList();
      }

      final al = tp['activity_level'];
      if (al != null) {
        out['activity_level'] = al is int ? al : int.tryParse(al.toString()) ?? 3;
      }

      final pp = tp['preferred_place'];
      if (pp != null) out['preferred_place'] = pp.toString();

      final tt = tp['travel_type'];
      if (tt != null) out['travel_type'] = tt.toString();

      if (tp.containsKey('has_accessibility')) {
        out['has_accessibility'] = tp['has_accessibility'] == true;
      }
      final ad = tp['accessibility_detail'];
      if (ad != null) out['accessibility_detail'] = ad.toString();

      if (tp.containsKey('has_visited_before')) {
        out['has_visited_before'] = tp['has_visited_before'] == true;
      }

      final rest = tp['restrictions'];
      if (rest != null) out['restrictions'] = rest.toString();

      if (tp.containsKey('sustainable_preferences')) {
        out['sustainable_preferences'] = tp['sustainable_preferences'] == true;
      }

      return out;
    } catch (_) {
      return {};
    }
  }

  /// Intereses desde GET /profiles/me (traveler_profile.interests).
  static Future<List<String>> getSavedInterests() async {
    final auth = AuthService();
    final token = await auth.getToken();
    if (token == null) return [];

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.profilesMe}');
    try {
      final response = await http
          .get(
            url,
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) return [];
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final profile = data['travelerProfile'];
      if (profile == null) return [];
      final interests = profile['interests'];
      if (interests is List) {
        return interests.map((e) => e.toString()).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}

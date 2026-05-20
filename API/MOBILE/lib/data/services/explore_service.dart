import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/place_model.dart';
import 'auth_service.dart';

class ExploreService {
  final AuthService _auth;

  ExploreService({AuthService? authService})
      : _auth = authService ?? AuthService();

  Map<String, String> _headers(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  /// tourism_type en BD: 1=Naturaleza, 2=Cultura, 3=Gastronomía
  static PlaceCategory _categoryFromPoiType(int? idType) {
    switch (idType) {
      case 1:
        return PlaceCategory.adventures;
      case 2:
        return PlaceCategory.museums;
      case 3:
        return PlaceCategory.restaurants;
      default:
        return PlaceCategory.museums;
    }
  }

  static PlaceCategory? _categoryFromServiceType(String? type) {
    if (type == null) return null;
    final lower = type.toLowerCase();
    if (lower.contains('hotel') ||
        lower.contains('hospedaje') ||
        lower.contains('alojamiento')) {
      return PlaceCategory.hotels;
    }
    if (lower.contains('restaurante') ||
        lower.contains('comida') ||
        lower.contains('gastro')) {
      return PlaceCategory.restaurants;
    }
    if (lower.contains('museo') ||
        lower.contains('cultural') ||
        lower.contains('galería')) {
      return PlaceCategory.museums;
    }
    if (lower.contains('tour') ||
        lower.contains('aventura') ||
        lower.contains('deporte') ||
        lower.contains('ecoturismo') ||
        lower.contains('senderismo') ||
        lower.contains('excurs')) {
      return PlaceCategory.adventures;
    }
    return null;
  }

  /// Un solo GET: ubicaciones + servicios turísticos + POIs (API `/explore/home`).
  Future<List<CityData>> fetchCities() async {
    final token = await _auth.getToken();
    if (token == null) throw AuthException('No auth token available');

    final uri = Uri.parse(
      '${ApiConstants.baseUrl}${ApiConstants.exploreHome}',
    );
    final response = await http
        .get(uri, headers: _headers(token))
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw ExploreException(
        'Failed to load explore home (${response.statusCode})',
      );
    }

    final data =
        jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    final List<dynamic> rawCities = data['cities'] ?? [];

    final List<CityData> cities = [];
    for (final raw in rawCities) {
      final c = raw as Map<String, dynamic>;
      final String name = (c['name'] ?? '') as String;
      final double lat = _toDouble(c['latitude']);
      final double lon = _toDouble(c['longitude']);

      final places = <Place>[];

      for (final s in (c['services'] as List<dynamic>? ?? [])) {
        final place = _placeFromService(s as Map<String, dynamic>, name);
        if (place != null) places.add(place);
      }
      for (final p in (c['points'] as List<dynamic>? ?? [])) {
        places.add(_placeFromPoi(p as Map<String, dynamic>, name));
      }

      cities.add(CityData(
        name: name,
        chipIcon: _iconForCity(name),
        lat: lat,
        lon: lon,
        places: places,
      ));
    }
    return cities;
  }

  static Place? _placeFromService(Map<String, dynamic> s, String cityName) {
    final cat = _categoryFromServiceType(s['service_type'] as String?);
    if (cat == null) return null;
    final rating = _toDouble(s['total_score'], fallback: 4.0);
    return Place(
      id: 'svc_${s['id_service']}',
      name: (s['name'] ?? '') as String,
      city: cityName,
      category: cat,
      imageUrl: (s['image_url'] as String?) ?? '',
      rating: rating,
      shortDescription: _truncate(s['description'] as String?, 80),
      description: (s['description'] ?? '') as String,
      locationLine: cityName,
      galleryUrls: const [],
    );
  }

  static Place _placeFromPoi(Map<String, dynamic> p, String cityName) {
    final cat = _categoryFromPoiType(p['id_type'] as int?);
    return Place(
      id: 'poi_${p['id_point']}',
      name: (p['name'] ?? '') as String,
      city: cityName,
      category: cat,
      imageUrl: (p['image_url'] as String?) ?? '',
      rating: _toDouble(p['rating'], fallback: 4.0),
      shortDescription: _truncate(p['description'] as String?, 80),
      description: (p['description'] ?? '') as String,
      locationLine: cityName,
      galleryUrls: const [],
    );
  }

  static double _toDouble(dynamic value, {double fallback = 0.0}) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static String _truncate(String? text, int maxLen) {
    if (text == null || text.length <= maxLen) return text ?? '';
    return '${text.substring(0, maxLen)}…';
  }

  /// Normaliza para coincidir aunque el API devuelva sin acentos.
  static String _normCity(String name) {
    return name
        .toLowerCase()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u')
        .replaceAll('ñ', 'n')
        .replaceAll('ü', 'u');
  }

  static IconData _iconForCity(String name) {
    final n = _normCity(name);
    if (n.contains('xalapa')) return Icons.park_outlined;
    if (n.contains('coatepec')) return Icons.coffee_rounded;
    if (n.contains('cordoba')) return Icons.account_balance_rounded;
    if (n.contains('orizaba')) return Icons.landscape_rounded;
    if (n.contains('fortin')) return Icons.local_florist_rounded;
    if (n.contains('xico')) return Icons.water_drop_outlined;
    return Icons.location_city_rounded;
  }
}

class ExploreException implements Exception {
  final String message;
  ExploreException(this.message);
  @override
  String toString() => message;
}

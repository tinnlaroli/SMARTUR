import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/constants/api_constants.dart';
import '../models/place_model.dart';
import 'api_client.dart';
import 'auth_service.dart';
import 'cache_service.dart';

class ExploreService {
  static const _citiesCacheKey = 'explore_cities';

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

  /// Mapea service_type a categoría. Nunca devuelve null — usa museums como fallback
  /// para que ningún servicio se descarte silenciosamente de la UI.
  static PlaceCategory _categoryFromServiceType(String? type) {
    if (type == null) return PlaceCategory.museums;
    final lower = type.toLowerCase();
    if (lower.contains('hotel') ||
        lower.contains('hospedaje') ||
        lower.contains('alojamiento') ||
        lower.contains('posada') ||
        lower.contains('cabaña') ||
        lower.contains('hostal')) {
      return PlaceCategory.hotels;
    }
    if (lower.contains('restaurante') ||
        lower.contains('restaurant') ||
        lower.contains('comida') ||
        lower.contains('gastro') ||
        lower.contains('alimento') ||
        lower.contains('bebida') ||
        lower.contains('café') ||
        lower.contains('cafeteria') ||
        lower.contains('bar') ||
        lower.contains('fonda') ||
        lower.contains('cocina')) {
      return PlaceCategory.restaurants;
    }
    if (lower.contains('tour') ||
        lower.contains('aventura') ||
        lower.contains('deporte') ||
        lower.contains('ecoturismo') ||
        lower.contains('senderismo') ||
        lower.contains('excurs') ||
        lower.contains('naturaleza') ||
        lower.contains('parque') ||
        lower.contains('actividad') ||
        lower.contains('tirolesa') ||
        lower.contains('rafting') ||
        lower.contains('escalada')) {
      return PlaceCategory.adventures;
    }
    if (lower.contains('museo') ||
        lower.contains('cultural') ||
        lower.contains('galería') ||
        lower.contains('galeria') ||
        lower.contains('artesania') ||
        lower.contains('artesanía') ||
        lower.contains('patrimonio') ||
        lower.contains('histor') ||
        lower.contains('arte') ||
        lower.contains('iglesia') ||
        lower.contains('templo')) {
      return PlaceCategory.museums;
    }
    // Fallback — nunca descarta un servicio del catálogo
    return PlaceCategory.museums;
  }

  /// Un solo GET: ubicaciones + servicios turísticos + POIs (API `/explore/home`).
  /// Guarda el resultado en cache. En caso de error de red usa el cache como fallback.
  ///
  /// Returns a [CitiesResult] with the data and whether it came from cache.
  Future<CitiesResult> fetchCitiesWithFallback() async {
    try {
      final cities = await _fetchCitiesFromNetwork();
      // Save to cache on success
      await CacheService.write(_citiesCacheKey, CityData.listToJson(cities));
      return CitiesResult(cities: cities, fromCache: false);
    } on ApiNetworkException {
      // Try cache — accept up to 7 days stale on network error
      final entry = await CacheService.readStale(_citiesCacheKey);
      if (entry != null) {
        try {
          final cities = CityData.listFromJson(entry.data);
          // Restore chipIcon from city name (was not serialized)
          final restored = cities
              .map((c) => CityData(
                    name: c.name,
                    chipIcon: _iconForCity(c.name),
                    lat: c.lat,
                    lon: c.lon,
                    places: c.places,
                  ))
              .toList();
          return CitiesResult(
            cities: restored,
            fromCache: true,
            cacheAge: entry.ageLabel,
          );
        } catch (_) {
          // Cache corrupt — rethrow original error
        }
      }
      rethrow;
    }
  }

  /// Equivalent to old fetchCities() — throws on any error (no fallback).
  Future<List<CityData>> fetchCities() async => _fetchCitiesFromNetwork();

  Future<List<CityData>> _fetchCitiesFromNetwork() async {
    final uri = Uri.parse(
      '${ApiConstants.baseUrl}${ApiConstants.exploreHome}',
    );

    final response = await ApiClient.get(uri);

    if (response.statusCode == 401) {
      throw AuthException('Sesión expirada. Inicia sesión de nuevo.');
    }
    if (response.statusCode != 200) {
      final msg = ApiClient.extractApiMessage(
        response,
        fallback: 'Error al cargar lugares (${response.statusCode})',
      );
      throw ExploreException(msg);
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
        places.add(_placeFromService(s as Map<String, dynamic>, name));
      }
      for (final p in (c['points'] as List<dynamic>? ?? [])) {
        places.add(_placeFromPoi(p as Map<String, dynamic>, name));
      }

      // Solo incluir ciudades que tengan al menos un lugar
      if (places.isNotEmpty) {
        cities.add(CityData(
          name: name,
          chipIcon: _iconForCity(name),
          lat: lat,
          lon: lon,
          places: places,
        ));
      }
    }
    return cities;
  }

  static Place _placeFromService(Map<String, dynamic> s, String cityName) {
    final cat = _categoryFromServiceType(s['service_type'] as String?);
    final rating = _toDouble(s['total_score'], fallback: 4.0);
    final rawUrl = (s['image_url'] as String?) ?? '';
    return Place(
      id: 'svc_${s['id_service']}',
      name: (s['name'] ?? '') as String,
      city: cityName,
      category: cat,
      imageUrl: rawUrl.isNotEmpty ? rawUrl : _fallbackForCategory(cat, cityName),
      rating: rating,
      shortDescription: _truncate(s['description'] as String?, 80),
      description: (s['description'] ?? '') as String,
      locationLine: cityName,
      galleryUrls: const [],
    );
  }

  static Place _placeFromPoi(Map<String, dynamic> p, String cityName) {
    final cat = _categoryFromPoiType(p['id_type'] as int?);
    final lat = p['latitude'] != null ? _toDouble(p['latitude']) : null;
    final lon = p['longitude'] != null ? _toDouble(p['longitude']) : null;
    final rawUrl = (p['image_url'] as String?) ?? '';
    return Place(
      id: 'poi_${p['id_point']}',
      name: (p['name'] ?? '') as String,
      city: cityName,
      category: cat,
      imageUrl: _resolvePoiUrl(rawUrl, cityName),
      rating: _toDouble(p['rating'], fallback: 4.0),
      shortDescription: _truncate(p['description'] as String?, 80),
      description: (p['description'] ?? '') as String,
      locationLine: cityName,
      galleryUrls: const [],
      lat: lat != 0.0 ? lat : null,
      lon: lon != 0.0 ? lon : null,
    );
  }

  // ── Image URL resolution ───────────────────────────────────────────────────

  static String _resolvePoiUrl(String rawUrl, String city) {
    if (rawUrl.isEmpty) return _fallbackForCity(city);
    // Direct upload.wikimedia.org URLs are verified working — keep them.
    if (rawUrl.startsWith('https://upload.wikimedia.org')) return rawUrl;
    // commons.wikimedia.org redirect URLs often 404 — replace with city fallback.
    if (rawUrl.startsWith('https://commons.wikimedia.org')) return _fallbackForCity(city);
    // Any other URL (custom upload from admin panel) — keep as-is.
    return rawUrl;
  }

  // ── Fallback images (verified upload.wikimedia.org thumbnails) ─────────────

  // Full-size URLs confirmed working (verified via HTTP redirect trace)
  static const _imgCascada    = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Cascada_de_Texolo.jpg';
  static const _imgMuseoXal   = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Museo_de_Antropolog%C3%ADa_de_Xalapa.jpg';
  static const _imgPalacioOri = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Palacio_de_hierro_de_Orizaba%2C_Veracruz.jpg';
  static const _imgFortin     = 'https://upload.wikimedia.org/wikipedia/commons/5/51/Fort%C3%ADn_de_las_flores%2C_Veracruz.jpg';
  static const _imgCordoba    = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Riverwalk_with_Public_Art_-_Cordoba_-_Veracruz_-_Mexico_-_02.jpg';
  static const _imgXico       = 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Parroquia_de_Santa_Mar%C3%ADa_Magdalena_Xico_%28Veracruz%29.jpg';
  static const _imgPico       = 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Pico_de_Orizaba%2C_Veracruz..JPG';
  static const _imgCoatepec   = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Iglesia_San_Jer%C3%B3nimo.JPG';

  static String _fallbackForCategory(PlaceCategory cat, String city) {
    switch (cat) {
      case PlaceCategory.hotels:
        return _fallbackForCity(city);
      case PlaceCategory.restaurants:
        return _imgCoatepec;
      case PlaceCategory.adventures:
        return _imgCascada;
      case PlaceCategory.museums:
        return _imgMuseoXal;
    }
  }

  static String _fallbackForCity(String city) {
    final c = city.toLowerCase();
    if (c.contains('xalapa') || c.contains('jalapa')) return _imgMuseoXal;
    if (c.contains('coatepec'))                        return _imgCascada;
    if (c.contains('orizaba'))                         return _imgPalacioOri;
    if (c.contains('fort') || c.contains('flores'))    return _imgFortin;
    if (c.contains('rdoba'))                           return _imgCordoba;
    if (c.contains('xico'))                            return _imgXico;
    return _imgPico;
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

/// Result of [ExploreService.fetchCitiesWithFallback].
class CitiesResult {
  final List<CityData> cities;

  /// True when data came from local cache (no network).
  final bool fromCache;

  /// Human-readable cache age when [fromCache] is true, e.g. "hace 3 h".
  final String? cacheAge;

  const CitiesResult({
    required this.cities,
    required this.fromCache,
    this.cacheAge,
  });
}

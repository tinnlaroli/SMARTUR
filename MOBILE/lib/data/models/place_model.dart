import 'dart:convert';
import 'package:flutter/material.dart';

enum PlaceCategory {
  hotels(Icons.hotel_rounded, 'Hotelería', Color(0xFF4DB9CA)),
  restaurants(Icons.restaurant_rounded, 'Restaurantes', Color(0xFFFF7D1F)),
  museums(Icons.museum_rounded, 'Museos', Color(0xFF984EFD)),
  adventures(Icons.terrain_rounded, 'Aventuras', Color(0xFF9CCC44));

  final IconData icon;
  final String label;
  final Color color;
  const PlaceCategory(this.icon, this.label, this.color);
}

class Place {
  final String id;
  final String name;
  final String city;
  final PlaceCategory category;
  final String imageUrl;
  final double rating;
  final String shortDescription;
  final String description;
  final String locationLine;
  final List<String> galleryUrls;

  /// Coordenadas del lugar (pueden ser null si no están en la BD).
  final double? lat;
  final double? lon;

  const Place({
    required this.id,
    required this.name,
    required this.city,
    required this.category,
    required this.imageUrl,
    required this.rating,
    required this.shortDescription,
    required this.description,
    required this.locationLine,
    this.galleryUrls = const [],
    this.lat,
    this.lon,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'city': city,
        'category': category.name,
        'imageUrl': imageUrl,
        'rating': rating,
        'shortDescription': shortDescription,
        'description': description,
        'locationLine': locationLine,
        'galleryUrls': galleryUrls,
        if (lat != null) 'lat': lat,
        if (lon != null) 'lon': lon,
      };

  factory Place.fromJson(Map<String, dynamic> json) => Place(
        id: json['id'] as String,
        name: json['name'] as String,
        city: json['city'] as String,
        category: PlaceCategory.values.firstWhere(
          (e) => e.name == json['category'],
          orElse: () => PlaceCategory.museums,
        ),
        imageUrl: json['imageUrl'] as String? ?? '',
        rating: (json['rating'] as num).toDouble(),
        shortDescription: json['shortDescription'] as String? ?? '',
        description: json['description'] as String? ?? '',
        locationLine: json['locationLine'] as String? ?? '',
        galleryUrls: (json['galleryUrls'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            const [],
        lat: (json['lat'] as num?)?.toDouble(),
        lon: (json['lon'] as num?)?.toDouble(),
      );
}

class CityData {
  final String name;
  final IconData chipIcon;
  final double lat;
  final double lon;
  final List<Place> places;

  const CityData({
    required this.name,
    required this.chipIcon,
    required this.lat,
    required this.lon,
    required this.places,
  });

  List<Place> byCategory(PlaceCategory? cat) =>
      cat == null ? places : places.where((p) => p.category == cat).toList();

  Map<String, dynamic> toJson() => {
        'name': name,
        'lat': lat,
        'lon': lon,
        'places': places.map((p) => p.toJson()).toList(),
      };

  factory CityData.fromJson(Map<String, dynamic> json) => CityData(
        name: json['name'] as String,
        // chipIcon no se serializa — se reconstruye por nombre en ExploreService
        chipIcon: Icons.location_city_rounded,
        lat: (json['lat'] as num).toDouble(),
        lon: (json['lon'] as num).toDouble(),
        places: (json['places'] as List<dynamic>)
            .map((p) => Place.fromJson(p as Map<String, dynamic>))
            .toList(),
      );

  /// Serializa una lista de ciudades a JSON string.
  static String listToJson(List<CityData> cities) =>
      jsonEncode(cities.map((c) => c.toJson()).toList());

  /// Deserializa una lista de ciudades desde JSON string.
  static List<CityData> listFromJson(String raw) {
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => CityData.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

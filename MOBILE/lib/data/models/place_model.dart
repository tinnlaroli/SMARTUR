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
  });
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
}

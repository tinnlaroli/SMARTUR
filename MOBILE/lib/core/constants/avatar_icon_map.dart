import 'package:flutter/material.dart';

/// Claves alineadas con ALLOWED_AVATAR_ICON_KEYS en el API.
const List<String> kAllowedAvatarIconKeys = [
  'hiking',
  'museum',
  'beach',
  'restaurant',
  'hotel',
  'camera',
  'park',
  'flight',
  'map',
];

IconData? iconForAvatarKey(String? key) {
  if (key == null || key.isEmpty) return null;
  switch (key) {
    case 'hiking':
      return Icons.hiking;
    case 'museum':
      return Icons.museum;
    case 'beach':
      return Icons.beach_access;
    case 'restaurant':
      return Icons.restaurant;
    case 'hotel':
      return Icons.hotel;
    case 'camera':
      return Icons.photo_camera;
    case 'park':
      return Icons.park;
    case 'flight':
      return Icons.flight;
    case 'map':
      return Icons.map;
    default:
      return null;
  }
}

import 'package:shared_preferences/shared_preferences.dart';

/// Simple key-value cache backed by SharedPreferences.
///
/// Stores JSON strings alongside their write timestamp.
/// Entries expire after [ttl] (default 24 hours).
///
/// Usage:
///   await CacheService.write('explore_cities', jsonString);
///   final result = await CacheService.read('explore_cities');
///   if (result != null) { /* use result.data */ }
class CacheService {
  static const Duration _defaultTtl = Duration(hours: 24);
  static const String _tsPrefix = '__ts__';

  /// Write [data] under [key]. Returns true on success.
  static Future<bool> write(String key, String data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now().millisecondsSinceEpoch;
      await prefs.setString(key, data);
      await prefs.setInt('$_tsPrefix$key', now);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Read [key]. Returns [CacheEntry] or null if missing / expired.
  static Future<CacheEntry?> read(
    String key, {
    Duration ttl = _defaultTtl,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(key);
      if (data == null) return null;

      final ts = prefs.getInt('$_tsPrefix$key') ?? 0;
      final age = DateTime.now()
          .difference(DateTime.fromMillisecondsSinceEpoch(ts));

      if (age > ttl) return null; // expired

      return CacheEntry(data: data, age: age);
    } catch (_) {
      return null;
    }
  }

  /// Read [key] ignoring TTL — returns stale data if present.
  /// Useful for ultra-offline fallback when even expired data is better than nothing.
  static Future<CacheEntry?> readStale(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(key);
      if (data == null) return null;

      final ts = prefs.getInt('$_tsPrefix$key') ?? 0;
      final age = DateTime.now()
          .difference(DateTime.fromMillisecondsSinceEpoch(ts));

      return CacheEntry(data: data, age: age);
    } catch (_) {
      return null;
    }
  }

  /// Delete a specific key.
  static Future<void> delete(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
      await prefs.remove('$_tsPrefix$key');
    } catch (_) {}
  }
}

class CacheEntry {
  final String data;

  /// How long ago this entry was written.
  final Duration age;

  const CacheEntry({required this.data, required this.age});

  /// Human-readable age string (e.g. "hace 3 h").
  String get ageLabel {
    final minutes = age.inMinutes;
    if (minutes < 1) return 'hace un momento';
    if (minutes < 60) return 'hace $minutes min';
    final hours = age.inHours;
    if (hours < 24) return 'hace $hours h';
    return 'hace ${age.inDays} día${age.inDays != 1 ? 's' : ''}';
  }
}

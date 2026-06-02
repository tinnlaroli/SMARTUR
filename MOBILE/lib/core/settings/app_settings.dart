import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

@immutable
class AppSettings {
  final ThemeMode themeMode;
  final Locale? locale;

  const AppSettings({
    required this.themeMode,
    this.locale,
  });

  AppSettings copyWith({
    ThemeMode? themeMode,
    Locale? locale,
  }) {
    return AppSettings(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
    );
  }
}

class AppSettingsNotifier extends ValueNotifier<AppSettings> {
  static const String _darkModeKey = 'dark_mode';
  static const String _languageKey = 'language';

  final SharedPreferences _prefs;

  AppSettingsNotifier._(this._prefs, AppSettings initial) : super(initial);

  static Future<AppSettingsNotifier> load() async {
    final prefs = await SharedPreferences.getInstance();

    final dark = prefs.getBool(_darkModeKey);
    final themeMode = dark == null ? ThemeMode.system : (dark ? ThemeMode.dark : ThemeMode.light);

    final languageStored = prefs.getString(_languageKey);
    final locale = languageStored == null ? null : _localeFromStoredValue(languageStored);

    return AppSettingsNotifier._(
      prefs,
      AppSettings(
        themeMode: themeMode,
        locale: locale,
      ),
    );
  }

  bool get isDarkMode => value.themeMode == ThemeMode.dark;

  Future<void> setThemeMode(ThemeMode mode) async {
    value = AppSettings(themeMode: mode, locale: value.locale);
    if (mode == ThemeMode.system) {
      await _prefs.remove(_darkModeKey);
    } else {
      await _prefs.setBool(_darkModeKey, mode == ThemeMode.dark);
    }
  }

  Future<void> setDarkMode(bool enabled) => setThemeMode(enabled ? ThemeMode.dark : ThemeMode.light);

  Future<void> toggleDarkMode() => setDarkMode(!isDarkMode);

  Future<void> setLocale(Locale? locale) async {
    value = AppSettings(themeMode: value.themeMode, locale: locale);
    if (locale == null) {
      await _prefs.remove(_languageKey);
    } else {
      await _prefs.setString(_languageKey, locale.languageCode);
    }
  }

  static Locale _localeFromStoredValue(String value) {
    switch (value) {
      case 'en':
      case 'English':
        return const Locale('en');
      case 'fr':
      case 'Français':
        return const Locale('fr');
      case 'pt':
      case 'Português':
        return const Locale('pt');
      case 'es':
      case 'Español':
      default:
        return const Locale('es');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemeMode { system, light, dark, welltur }

@immutable
class AppSettings {
  final AppThemeMode themeMode;
  final Locale? locale;

  const AppSettings({
    required this.themeMode,
    this.locale,
  });

  AppSettings copyWith({
    AppThemeMode? themeMode,
    Locale? locale,
  }) {
    return AppSettings(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
    );
  }
}

class AppSettingsNotifier extends ValueNotifier<AppSettings> {
  static const String _themeModeKey = 'theme_mode';
  static const String _darkModeKey  = 'dark_mode'; // legacy — read once for migration
  static const String _languageKey  = 'language';

  final SharedPreferences _prefs;

  AppSettingsNotifier._(this._prefs, AppSettings initial) : super(initial);

  static Future<AppSettingsNotifier> load() async {
    final prefs = await SharedPreferences.getInstance();

    AppThemeMode themeMode;
    final stored = prefs.getString(_themeModeKey);
    if (stored != null) {
      themeMode = _themeModeFromString(stored);
    } else {
      // Migrate from legacy bool key
      final legacy = prefs.getBool(_darkModeKey);
      themeMode = legacy == null
          ? AppThemeMode.system
          : (legacy ? AppThemeMode.dark : AppThemeMode.light);
    }

    final languageStored = prefs.getString(_languageKey);
    final locale = languageStored == null ? null : _localeFromStoredValue(languageStored);

    return AppSettingsNotifier._(
      prefs,
      AppSettings(themeMode: themeMode, locale: locale),
    );
  }

  bool get isDarkMode => value.themeMode == AppThemeMode.dark;

  Future<void> setThemeMode(AppThemeMode mode) async {
    value = AppSettings(themeMode: mode, locale: value.locale);
    await _prefs.setString(_themeModeKey, _stringFromThemeMode(mode));
  }

  Future<void> setLocale(Locale? locale) async {
    value = AppSettings(themeMode: value.themeMode, locale: locale);
    if (locale == null) {
      await _prefs.remove(_languageKey);
    } else {
      await _prefs.setString(_languageKey, locale.languageCode);
    }
  }

  static String _stringFromThemeMode(AppThemeMode mode) => switch (mode) {
    AppThemeMode.light   => 'light',
    AppThemeMode.dark    => 'dark',
    AppThemeMode.welltur => 'welltur',
    AppThemeMode.system  => 'system',
  };

  static AppThemeMode _themeModeFromString(String value) => switch (value) {
    'light'   => AppThemeMode.light,
    'dark'    => AppThemeMode.dark,
    'welltur' => AppThemeMode.welltur,
    _         => AppThemeMode.system,
  };

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

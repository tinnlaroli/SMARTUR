class EnvConfig {
  /// Base URL del backend WELLTUR (por ejemplo: https://api-welltur.fly.dev/api/v2)
  static const String apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.welltur.online/api/v2');

  /// URL del Motor de IA
  static const String aiEngineUrl =
      String.fromEnvironment('AI_ENGINE_URL', defaultValue: 'https://ml.welltur.online');

  /// Client ID de Google Sign-In (server client ID — Firebase Web Client)
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '1076586296171-q7mr8bdhbsm5rncmfsug58mb9t3gio2j.apps.googleusercontent.com',
  );

  /// API key de OpenWeatherMap (solo desde --dart-define o similar)
  static const String openWeatherApiKey = String.fromEnvironment(
    'OPENWEATHER_API_KEY',
    defaultValue: '',
  );
}
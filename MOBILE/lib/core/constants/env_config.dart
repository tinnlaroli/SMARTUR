class EnvConfig {
  /// Base URL del backend SMARTUR (por ejemplo: https://api-smartur.fly.dev/api/v2)
  static const String apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://2.24.112.25:4000/api/v2');

  /// URL del Motor de IA
  static const String aiEngineUrl =
      String.fromEnvironment('AI_ENGINE_URL', defaultValue: 'http://2.24.112.25:8000');

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
import 'env_config.dart';

class ApiConstants {
  // static const String baseUrl = 'http://192.168.1.94:3000/api/v2';
  static const String baseUrl = EnvConfig.apiBaseUrl;

  // Auth
  static const String register = '/users/register';
  static const String login = '/login';
  static const String twoFactor = '/two-factor';
  static const String forgot = '/forgot';
  static const String reset = '/reset';

  // Users
  static const String users = '/users';

  // Profiles
  static const String preferences = '/profiles/preferences';
  static const String profilesMe = '/profiles/me';

  // User content (diario / comunidad)
  static const String meFavorites = '/me/favorites';
  static const String meVisits = '/me/visits';
  static const String communityPosts = '/community/posts';

  // Explore
  static const String exploreHome = '/explore/home';
  static const String locations = '/locations';
  static const String touristServices = '/tourist-services';
  static const String pointsOfInterest = '/points-of-interest';
}
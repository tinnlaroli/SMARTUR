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
  // communityPostReport: replace {id} with actual post ID
  static const String communityReports = '/community/reports';

  // ML interaction telemetry
  static const String meInteractions = '/me/interactions';
  static const String meRating = '/me/rating';
  static const String mlFeedback = '/ml/feedback';
  static const String mlSessionsMe = '/ml/sessions/me';
  static const String mlRecommend = '/ml/recommend';

  // Session management
  static const String meSessions = '/me/sessions';

  // Auth — refresh / logout
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';

  // Explore
  static const String exploreHome = '/explore/home';
  static const String locations = '/locations';
  static const String touristServices = '/tourist-services';
  static const String pointsOfInterest = '/points-of-interest';

  // Itineraries
  static const String itineraries = '/itineraries';
  static const String itinerariesMe = '/itineraries/me';
  static const String itinerariesPredefined = '/itineraries/predefined';
  static const String itinerariesCommunity = '/itineraries/community';
  static const String itinerariesSearch = '/itineraries/search';
  static const String itinerariesFollowing = '/itineraries/following';

  // Social
  static const String usersSearch = '/users/search';

  // Bookings
  static const String bookings = '/bookings';
  static const String bookingsMe = '/bookings/me';

  // Chat
  static const String conversations = '/conversations';
  static const String conversationsMe = '/conversations/me';
}
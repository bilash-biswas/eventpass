/// Global application constants for EventPass mobile.
class AppConstants {
  AppConstants._();

  static const String appName = 'EventPass';

  // Secure Storage Keys
  static const String accessTokenKey = 'eventpass_access_token';
  static const String refreshTokenKey = 'eventpass_refresh_token';
  static const String userRoleKey = 'eventpass_user_role';
  static const String userIdKey = 'eventpass_user_id';
  static const String userNameKey = 'eventpass_user_name';
  static const String userEmailKey = 'eventpass_user_email';

  // Network Timeouts
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);
  static const Duration sendTimeout = Duration(seconds: 10);

  // Pagination Defaults
  static const int defaultPageSize = 10;
}

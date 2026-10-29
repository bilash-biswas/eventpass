import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// REST API Endpoints configuration for the EventPass backend.
class ApiEndpoints {
  ApiEndpoints._();

  /// Resolves the backend base URL dynamically depending on the execution target.
  /// Android Emulator uses 10.0.2.2 to reach host localhost.
  /// Can be overridden via `--dart-define=API_BASE_URL=http://...`
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) {
      return fromEnv;
    }

    if (kIsWeb) {
      return 'http://localhost:3000';
    }

    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:3000';
      }
    } catch (_) {
      // Fallback for platforms where Platform is unsupported
    }

    return 'http://localhost:3000';
  }

  // Auth endpoints
  static const String authLogin = '/v1/auth/login';
  static const String authRegister = '/v1/auth/register';
  static const String authRefresh = '/v1/auth/refresh';
  static const String authLogout = '/v1/auth/logout';

  // User endpoints
  static const String usersMe = '/v1/users/me';

  // Events endpoints
  static const String events = '/v1/events';
  static String eventBySlug(String slug) => '/v1/events/$slug';
  static String eventById(String id) => '/v1/events/$id';
  static String eventAttendees(String id) => '/v1/events/$id/attendees';

  // Tickets endpoints
  static String eventRsvp(String eventId) => '/v1/events/$eventId/rsvp';
  static const String ticketsMe = '/v1/tickets/me';
  static const String ticketsCheckIn = '/v1/tickets/check-in';
}

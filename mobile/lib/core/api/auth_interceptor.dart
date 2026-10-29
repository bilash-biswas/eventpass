import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';

/// Queued Dio interceptor that handles Bearer token attachment and automatic
/// 401 token refresh with a concurrency lock to prevent multiple simultaneous refreshes.
class AuthInterceptor extends QueuedInterceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  final void Function()? _onUnauthenticated;

  AuthInterceptor({
    required Dio dio,
    required SecureStorageService storage,
    void Function()? onUnauthenticated,
  })  : _dio = dio,
        _storage = storage,
        _onUnauthenticated = onUnauthenticated;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = await _storage.getAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;
    final path = err.requestOptions.path;

    // Only intercept 401 Unauthorized for non-auth refresh/login endpoints
    if (statusCode == 401 &&
        !path.contains(ApiEndpoints.authRefresh) &&
        !path.contains(ApiEndpoints.authLogin)) {
      final refreshToken = await _storage.getRefreshToken();

      if (refreshToken == null || refreshToken.isEmpty) {
        await _storage.clearAll();
        _onUnauthenticated?.call();
        return handler.reject(err);
      }

      try {
        // Create an isolated Dio instance without interceptors to avoid recursion loops
        final refreshDio = Dio(
          BaseOptions(
            baseUrl: ApiEndpoints.baseUrl,
            headers: {'Content-Type': 'application/json'},
          ),
        );

        final refreshResponse = await refreshDio.post(
          ApiEndpoints.authRefresh,
          data: {'refreshToken': refreshToken},
        );

        if (refreshResponse.statusCode == 200 && refreshResponse.data != null) {
          final data = refreshResponse.data as Map<String, dynamic>;
          final newAccessToken = data['accessToken'] as String;
          final newRefreshToken = data['refreshToken'] as String;

          await _storage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );

          if (data['user'] != null) {
            final user = data['user'] as Map<String, dynamic>;
            await _storage.saveUserSession(
              id: user['id'] as String,
              name: user['name'] as String,
              email: user['email'] as String,
              role: user['role'] as String,
            );
          }

          // Retry the original failed request with the new access token
          final requestOptions = err.requestOptions;
          requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';

          final retriedResponse = await _dio.fetch(requestOptions);
          return handler.resolve(retriedResponse);
        } else {
          await _storage.clearAll();
          _onUnauthenticated?.call();
          return handler.reject(err);
        }
      } catch (refreshError) {
        // Refresh token expired or reuse detected
        await _storage.clearAll();
        _onUnauthenticated?.call();
        return handler.reject(err);
      }
    }

    return handler.next(err);
  }
}

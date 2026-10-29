import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:eventpass_mobile/core/api/auth_interceptor.dart';
import 'package:eventpass_mobile/core/storage/secure_storage_service.dart';

class MockDio extends Mock implements Dio {}
class MockSecureStorageService extends Mock implements SecureStorageService {}
class MockRequestInterceptorHandler extends Mock implements RequestInterceptorHandler {}
class MockErrorInterceptorHandler extends Mock implements ErrorInterceptorHandler {}

void main() {
  late MockDio mockDio;
  late MockSecureStorageService mockStorage;
  late AuthInterceptor interceptor;

  setUp(() {
    mockDio = MockDio();
    mockStorage = MockSecureStorageService();
    interceptor = AuthInterceptor(
      dio: mockDio,
      storage: mockStorage,
    );
  });

  test('onRequest adds Bearer token header if access token exists in storage', () async {
    when(() => mockStorage.getAccessToken()).thenAnswer((_) async => 'valid_access_token_123');
    final options = RequestOptions(path: '/v1/events');
    final handler = MockRequestInterceptorHandler();

    interceptor.onRequest(options, handler);

    // Allow async storage read to complete
    await Future.delayed(Duration.zero);

    expect(options.headers['Authorization'], 'Bearer valid_access_token_123');
    verify(() => handler.next(options)).called(1);
  });

  test('onRequest does not add header if access token is null', () async {
    when(() => mockStorage.getAccessToken()).thenAnswer((_) async => null);
    final options = RequestOptions(path: '/v1/events');
    final handler = MockRequestInterceptorHandler();

    interceptor.onRequest(options, handler);

    await Future.delayed(Duration.zero);

    expect(options.headers.containsKey('Authorization'), false);
    verify(() => handler.next(options)).called(1);
  });
}

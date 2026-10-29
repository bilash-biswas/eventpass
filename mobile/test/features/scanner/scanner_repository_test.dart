import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:eventpass_mobile/core/api/api_endpoints.dart';
import 'package:eventpass_mobile/features/scanner/data/models/check_in_result.dart';
import 'package:eventpass_mobile/features/scanner/data/scanner_repository.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late ScannerRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = ScannerRepository(mockDio);
  });

  test('checkIn returns success CheckInResult on 200 response', () async {
    when(
      () => mockDio.post(
        ApiEndpoints.ticketsCheckIn,
        data: {'code': 'EVT-VALID-CODE'},
      ),
    ).thenAnswer(
      (_) async => Response(
        requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
        statusCode: 200,
        data: {
          'message': 'Check-in successful',
          'ticket': {
            'id': 'ticket-1',
            'code': 'EVT-VALID-CODE',
            'status': 'CHECKED_IN',
            'eventId': 'event-1',
            'userId': 'user-1',
            'checkedInAt': '2026-10-29T20:00:00.000Z',
            'createdAt': '2026-10-20T10:00:00.000Z',
            'user': {
              'id': 'user-1',
              'email': 'attendee@example.com',
              'name': 'Alex Attendee',
              'role': 'ATTENDEE',
              'createdAt': '2026-10-01T00:00:00.000Z',
            },
          },
        },
      ),
    );

    final result = await repository.checkIn('EVT-VALID-CODE');

    expect(result.status, CheckInStatus.success);
    expect(result.statusCode, 200);
    expect(result.isSuccess, true);
    expect(result.ticket?.user?.name, 'Alex Attendee');
    expect(result.ticket?.user?.email, 'attendee@example.com');
    expect(result.ticket?.code, 'EVT-VALID-CODE');
  });

  test('checkIn handles 409 Conflict as alreadyUsed CheckInResult', () async {
    when(
      () => mockDio.post(
        ApiEndpoints.ticketsCheckIn,
        data: {'code': 'EVT-ALREADY-USED'},
      ),
    ).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
        response: Response(
          requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
          statusCode: 409,
          data: {'message': 'This ticket has already been checked in'},
        ),
      ),
    );

    final result = await repository.checkIn('EVT-ALREADY-USED');

    expect(result.status, CheckInStatus.alreadyUsed);
    expect(result.statusCode, 409);
    expect(result.isDoubleScan, true);
    expect(result.isSuccess, false);
    expect(result.message, 'This ticket has already been checked in');
  });

  test('checkIn handles 404 Not Found as notFound CheckInResult', () async {
    when(
      () => mockDio.post(
        ApiEndpoints.ticketsCheckIn,
        data: {'code': 'EVT-NONEXISTENT'},
      ),
    ).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
        response: Response(
          requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
          statusCode: 404,
          data: {'message': 'Invalid ticket code'},
        ),
      ),
    );

    final result = await repository.checkIn('EVT-NONEXISTENT');

    expect(result.status, CheckInStatus.notFound);
    expect(result.statusCode, 404);
    expect(result.isNotFound, true);
  });

  test('checkIn handles 403 Forbidden as unauthorized CheckInResult', () async {
    when(
      () => mockDio.post(
        ApiEndpoints.ticketsCheckIn,
        data: {'code': 'EVT-OTHER-ORG'},
      ),
    ).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
        response: Response(
          requestOptions: RequestOptions(path: ApiEndpoints.ticketsCheckIn),
          statusCode: 403,
          data: {
            'message':
                'You are not authorized to check in tickets for this event',
          },
        ),
      ),
    );

    final result = await repository.checkIn('EVT-OTHER-ORG');

    expect(result.status, CheckInStatus.unauthorized);
    expect(result.statusCode, 403);
    expect(result.isUnauthorized, true);
  });
}

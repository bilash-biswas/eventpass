import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'models/check_in_response.dart';
import 'models/check_in_result.dart';

final scannerRepositoryProvider = Provider<ScannerRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ScannerRepository(dio);
});

class ScannerRepository {
  final Dio _dio;

  ScannerRepository(this._dio);

  /// Performs atomic gate check-in for the given raw QR ticket code.
  Future<CheckInResult> checkIn(String rawCode) async {
    final code = rawCode.trim();

    try {
      final response = await _dio.post(
        ApiEndpoints.ticketsCheckIn,
        data: {'code': code},
      );

      final checkInResponse = CheckInResponse.fromJson(
        response.data as Map<String, dynamic>,
      );

      return CheckInResult(
        status: CheckInStatus.success,
        statusCode: 200,
        message: checkInResponse.message,
        ticket: checkInResponse.ticket,
        scannedCode: code,
        checkedInAt: checkInResponse.ticket.checkedInAt,
      );
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode ?? 500;
      final serverMessage = _extractErrorMessage(e);

      switch (statusCode) {
        case 409:
          return CheckInResult(
            status: CheckInStatus.alreadyUsed,
            statusCode: 409,
            message: serverMessage.isNotEmpty
                ? serverMessage
                : 'This ticket has already been checked in.',
            scannedCode: code,
          );
        case 404:
          return CheckInResult(
            status: CheckInStatus.notFound,
            statusCode: 404,
            message: 'Invalid ticket code: No matching ticket found.',
            scannedCode: code,
          );
        case 403:
          return CheckInResult(
            status: CheckInStatus.unauthorized,
            statusCode: 403,
            message: 'Unauthorized: You are not authorized to check in tickets for this event.',
            scannedCode: code,
          );
        case 400:
          return CheckInResult(
            status: CheckInStatus.cancelled,
            statusCode: 400,
            message: 'This ticket RSVP has been cancelled.',
            scannedCode: code,
          );
        default:
          return CheckInResult(
            status: CheckInStatus.error,
            statusCode: statusCode,
            message: serverMessage,
            scannedCode: code,
          );
      }
    } catch (e) {
      return CheckInResult(
        status: CheckInStatus.error,
        statusCode: 500,
        message: e.toString().replaceFirst('Exception: ', ''),
        scannedCode: code,
      );
    }
  }

  String _extractErrorMessage(DioException e) {
    if (e.response?.data != null && e.response?.data is Map) {
      final data = e.response!.data as Map;
      if (data['message'] != null) {
        if (data['message'] is List) {
          return (data['message'] as List).join(', ');
        }
        return data['message'].toString();
      }
      if (data['error'] != null) {
        return data['error'].toString();
      }
    }
    return e.message ?? 'An unexpected network error occurred.';
  }
}

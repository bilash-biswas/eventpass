import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/core/api/api_client.dart';
import 'package:eventpass_mobile/core/api/api_endpoints.dart';
import 'package:eventpass_mobile/features/tickets/data/models/ticket.dart';

final ticketsRepositoryProvider = Provider<TicketsRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TicketsRepository(dio);
});

class TicketsRepository {
  final Dio _dio;

  TicketsRepository(this._dio);

  /// Fetches all tickets owned by the authenticated attendee,
  /// including nested event details.
  Future<List<Ticket>> getMyTickets() async {
    try {
      final response = await _dio.get(ApiEndpoints.ticketsMe);
      final rawList = response.data as List<dynamic>;
      return rawList
          .map((json) => Ticket.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = _extractErrorMessage(e);
      throw Exception(message);
    }
  }

  /// Cancels an existing RSVP and releases the event spot back into capacity.
  Future<void> cancelTicket(String eventId) async {
    try {
      await _dio.delete(ApiEndpoints.eventRsvp(eventId));
    } on DioException catch (e) {
      final message = _extractErrorMessage(e);
      throw Exception(message);
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

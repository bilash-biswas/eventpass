import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/core/api/api_client.dart';
import 'package:eventpass_mobile/core/api/api_endpoints.dart';
import 'package:eventpass_mobile/features/events/data/models/event.dart';
import 'package:eventpass_mobile/features/events/data/models/paginated_events.dart';
import 'package:eventpass_mobile/features/tickets/data/models/ticket.dart';

final eventsRepositoryProvider = Provider<EventsRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return EventsRepository(dio);
});

class EventsRepository {
  final Dio _dio;

  EventsRepository(this._dio);

  Future<PaginatedEvents> getEvents({
    int page = 1,
    int pageSize = 10,
    String? search,
    String? sort = 'asc',
    String? from,
    String? to,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.events,
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
          if (sort != null) 'sort': sort,
          if (from != null) 'from': from,
          if (to != null) 'to': to,
        },
      );

      return PaginatedEvents.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = _extractErrorMessage(e);
      throw Exception(message);
    }
  }

  Future<Event> getEventBySlug(String slug) async {
    try {
      final response = await _dio.get(ApiEndpoints.eventBySlug(slug));
      return Event.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = _extractErrorMessage(e);
      throw Exception(message);
    }
  }

  Future<Ticket> rsvpToEvent(String eventId) async {
    try {
      final response = await _dio.post(ApiEndpoints.eventRsvp(eventId));
      return Ticket.fromJson(response.data as Map<String, dynamic>);
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

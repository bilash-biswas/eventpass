import 'package:freezed_annotation/freezed_annotation.dart';
import 'event.dart';

part 'paginated_events.freezed.dart';
part 'paginated_events.g.dart';

@freezed
class PaginatedEvents with _$PaginatedEvents {
  const factory PaginatedEvents({
    required int total,
    required int page,
    required int pageSize,
    required int totalPages,
    required List<Event> items,
  }) = _PaginatedEvents;

  factory PaginatedEvents.fromJson(Map<String, dynamic> json) =>
      _$PaginatedEventsFromJson(json);
}

import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../auth/data/models/user.dart';

part 'event.freezed.dart';
part 'event.g.dart';

@freezed
class Event with _$Event {
  const factory Event({
    required String id,
    required String slug,
    required String title,
    required String description,
    required String location,
    required String startsAt,
    required String endsAt,
    required int capacity,
    String? coverImageUrl,
    required String status,
    required String organizerId,
    User? organizer,
    int? ticketsCount,
    required String createdAt,
    required String updatedAt,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}

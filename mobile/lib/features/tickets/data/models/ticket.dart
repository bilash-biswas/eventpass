import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../auth/data/models/user.dart';
import '../../../events/data/models/event.dart';

part 'ticket.freezed.dart';
part 'ticket.g.dart';

@freezed
class Ticket with _$Ticket {
  const factory Ticket({
    required String id,
    required String code,
    required String status,
    required String eventId,
    required String userId,
    String? checkedInAt,
    required String createdAt,
    Event? event,
    User? user,
  }) = _Ticket;

  factory Ticket.fromJson(Map<String, dynamic> json) => _$TicketFromJson(json);
}

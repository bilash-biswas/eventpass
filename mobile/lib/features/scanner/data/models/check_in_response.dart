import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../tickets/data/models/ticket.dart';

part 'check_in_response.freezed.dart';
part 'check_in_response.g.dart';

@freezed
class CheckInResponse with _$CheckInResponse {
  const factory CheckInResponse({
    required String message,
    required Ticket ticket,
  }) = _CheckInResponse;

  factory CheckInResponse.fromJson(Map<String, dynamic> json) =>
      _$CheckInResponseFromJson(json);
}

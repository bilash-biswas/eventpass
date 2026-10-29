import '../../../tickets/data/models/ticket.dart';

enum CheckInStatus {
  success, // 200
  alreadyUsed, // 409
  notFound, // 404
  unauthorized, // 403
  cancelled, // 400
  error, // 500 or network error
}

/// Rich container holding the atomic gate check-in result and attendee details.
class CheckInResult {
  final CheckInStatus status;
  final int statusCode;
  final String message;
  final Ticket? ticket;
  final String? scannedCode;
  final String? checkedInAt;

  const CheckInResult({
    required this.status,
    required this.statusCode,
    required this.message,
    this.ticket,
    this.scannedCode,
    this.checkedInAt,
  });

  bool get isSuccess => status == CheckInStatus.success;
  bool get isDoubleScan => status == CheckInStatus.alreadyUsed;
  bool get isNotFound => status == CheckInStatus.notFound;
  bool get isUnauthorized => status == CheckInStatus.unauthorized;
  bool get isCancelled => status == CheckInStatus.cancelled;
}

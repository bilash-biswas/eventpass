import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static String getMonthBadge(DateTime dateTime) {
    return DateFormat('MMM').format(dateTime).toUpperCase();
  }

  static String getDayBadge(DateTime dateTime) {
    return DateFormat('d').format(dateTime);
  }

  static String formatFullDate(DateTime dateTime) {
    return DateFormat('EEE, MMM d, y • h:mm a').format(dateTime);
  }

  static String formatDateRange(DateTime start, DateTime end) {
    final sameDay = start.year == end.year &&
        start.month == end.month &&
        start.day == end.day;

    if (sameDay) {
      final datePart = DateFormat('EEE, MMM d, y').format(start);
      final startTime = DateFormat('h:mm a').format(start);
      final endTime = DateFormat('h:mm a').format(end);
      return '$datePart • $startTime – $endTime';
    }

    return '${formatFullDate(start)} – ${formatFullDate(end)}';
  }

  static bool isEventPast(DateTime endsAt) {
    return endsAt.isBefore(DateTime.now());
  }
}

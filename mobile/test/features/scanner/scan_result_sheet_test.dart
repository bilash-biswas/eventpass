import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eventpass_mobile/features/auth/data/models/user.dart';
import 'package:eventpass_mobile/features/events/data/models/event.dart';
import 'package:eventpass_mobile/features/scanner/data/models/check_in_result.dart';
import 'package:eventpass_mobile/features/scanner/presentation/widgets/scan_result_sheet.dart';
import 'package:eventpass_mobile/features/tickets/data/models/ticket.dart';

void main() {
  const testUser = User(
    id: 'user-1',
    email: 'sarah.attendee@gmail.com',
    name: 'Sarah Connor',
    role: 'ATTENDEE',
    createdAt: '2026-10-01T00:00:00.000Z',
  );

  const testEvent = Event(
    id: 'event-1',
    slug: 'flutter-summit',
    title: 'Flutter Summit 2026',
    description: 'Conference description',
    location: 'Tech Dome, Sector 4',
    startsAt: '2026-11-20T10:00:00.000Z',
    endsAt: '2026-11-20T18:00:00.000Z',
    capacity: 200,
    status: 'PUBLISHED',
    organizerId: 'org-1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  );

  const testTicket = Ticket(
    id: 'ticket-1',
    code: 'EVT-VALID-SARAH-99',
    status: 'CHECKED_IN',
    eventId: 'event-1',
    userId: 'user-1',
    checkedInAt: '2026-11-20T10:15:00.000Z',
    createdAt: '2026-10-15T00:00:00.000Z',
    user: testUser,
    event: testEvent,
  );

  testWidgets('ScanResultSheet renders Approved Check-In with attendee details',
      (WidgetTester tester) async {
    bool dismissed = false;

    final successResult = CheckInResult(
      status: CheckInStatus.success,
      statusCode: 200,
      message: 'Check-in successful',
      ticket: testTicket,
      scannedCode: 'EVT-VALID-SARAH-99',
      checkedInAt: '2026-11-20T10:15:00.000Z',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ScanResultSheet(
            result: successResult,
            onDismiss: () => dismissed = true,
          ),
        ),
      ),
    );

    expect(find.text('Check-In Approved!'), findsOneWidget);
    expect(find.text('Sarah Connor'), findsOneWidget);
    expect(find.text('sarah.attendee@gmail.com'), findsOneWidget);
    expect(find.text('Flutter Summit 2026'), findsOneWidget);
    expect(find.text('EVT-VALID-SARAH-99'), findsOneWidget);

    final scanNextBtn = find.text('Scan Next Attendee');
    expect(scanNextBtn, findsOneWidget);

    await tester.tap(scanNextBtn);
    expect(dismissed, true);
  });

  testWidgets('ScanResultSheet renders Already Checked In alert for 409 double scan',
      (WidgetTester tester) async {
    final doubleScanResult = const CheckInResult(
      status: CheckInStatus.alreadyUsed,
      statusCode: 409,
      message: 'This ticket has already been checked in',
      scannedCode: 'EVT-USED-PASS',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ScanResultSheet(
            result: doubleScanResult,
            onDismiss: () {},
          ),
        ),
      ),
    );

    expect(find.text('Already Checked In'), findsOneWidget);
    expect(
      find.text('This ticket has previously been scanned for entry.'),
      findsOneWidget,
    );
    expect(find.text('EVT-USED-PASS'), findsOneWidget);
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:eventpass_mobile/features/events/data/models/event.dart';
import 'package:eventpass_mobile/features/tickets/data/models/ticket.dart';
import 'package:eventpass_mobile/features/tickets/data/tickets_repository.dart';
import 'package:eventpass_mobile/features/tickets/presentation/controllers/tickets_controller.dart';
import 'package:eventpass_mobile/features/tickets/presentation/widgets/ticket_card.dart';

class MockTicketsRepository extends Mock implements TicketsRepository {}

void main() {
  late MockTicketsRepository mockRepo;

  const testEvent = Event(
    id: 'event-101',
    slug: 'flutter-con-2026',
    title: 'Flutter Global Summit 2026',
    description: 'The ultimate Flutter and Dart conference.',
    location: 'Moscone Center, San Francisco, CA',
    startsAt: '2026-11-20T10:00:00.000Z',
    endsAt: '2026-11-20T18:00:00.000Z',
    capacity: 500,
    status: 'PUBLISHED',
    organizerId: 'org-1',
    ticketsCount: 150,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  );

  const testTicket = Ticket(
    id: 'ticket-999',
    code: 'EVT-TESTCODE-160BIT-RANDOM',
    status: 'VALID',
    eventId: 'event-101',
    userId: 'user-42',
    createdAt: '2026-10-25T12:00:00.000Z',
    event: testEvent,
  );

  setUp(() {
    mockRepo = MockTicketsRepository();
    when(() => mockRepo.getMyTickets()).thenAnswer((_) async => [testTicket]);
  });

  Widget buildTestWidget({required Ticket ticket, VoidCallback? onCancelled}) {
    return ProviderScope(
      overrides: [
        ticketsRepositoryProvider.overrideWithValue(mockRepo),
        ticketsControllerProvider.overrideWith(
          (ref) => TicketsController(mockRepo),
        ),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: TicketCard(
              ticket: ticket,
              onCancelled: onCancelled,
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('TicketCard displays event title, location, code, and QR code',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(ticket: testTicket));
    await tester.pump();

    // Verify title and location are displayed
    expect(find.text('Flutter Global Summit 2026'), findsOneWidget);
    expect(find.text('Moscone Center, San Francisco, CA'), findsOneWidget);

    // Verify status badge
    expect(find.text('VALID'), findsOneWidget);

    // Verify ticket code text is displayed
    expect(find.text('EVT-TESTCODE-160BIT-RANDOM'), findsOneWidget);

    // Verify QR code widget is rendered
    expect(find.byType(QrImageView), findsOneWidget);

    // Verify action buttons
    expect(find.text('Copy'), findsOneWidget);
    expect(find.text('Pass'), findsOneWidget);
    expect(find.text('Cancel RSVP'), findsOneWidget);
  });

  testWidgets('TicketCard displays confirmation dialog on Cancel RSVP tap',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(ticket: testTicket));
    await tester.pump();

    // Tap Cancel RSVP
    final cancelBtn = find.text('Cancel RSVP');
    expect(cancelBtn, findsOneWidget);
    await tester.tap(cancelBtn);
    await tester.pumpAndSettle();

    // Verify confirmation dialog appears
    expect(find.text('Cancel Ticket RSVP?'), findsOneWidget);
    expect(find.text('Keep Ticket'), findsOneWidget);
    expect(find.text('Confirm Cancellation'), findsOneWidget);

    // Dismiss dialog
    await tester.tap(find.text('Keep Ticket'));
    await tester.pumpAndSettle();

    // Dialog is dismissed
    expect(find.text('Cancel Ticket RSVP?'), findsNothing);
  });

  testWidgets('TicketCard renders CHECKED_IN status badge and timestamp correctly',
      (WidgetTester tester) async {
    const checkedInTicket = Ticket(
      id: 'ticket-888',
      code: 'EVT-CHECKEDIN-CODE',
      status: 'CHECKED_IN',
      eventId: 'event-101',
      userId: 'user-42',
      checkedInAt: '2026-11-20T10:15:00.000Z',
      createdAt: '2026-10-25T12:00:00.000Z',
      event: testEvent,
    );

    await tester.pumpWidget(buildTestWidget(ticket: checkedInTicket));
    await tester.pump();

    expect(find.text('CHECKED IN'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    // Cancel RSVP should not be present for checked-in ticket
    expect(find.text('Cancel RSVP'), findsNothing);
  });
}

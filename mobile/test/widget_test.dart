import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/app.dart';
import 'package:eventpass_mobile/features/auth/data/models/user.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:eventpass_mobile/features/events/data/models/event.dart';
import 'package:eventpass_mobile/features/events/presentation/controllers/events_controller.dart';

void main() {
  testWidgets('EventPassApp mounts and renders Events screen', (WidgetTester tester) async {
    final mockEvent = Event(
      id: 'test-event-1',
      slug: 'tech-summit-2026',
      title: 'Global Tech Summit 2026',
      description: 'Comprehensive tech summit covering cloud and distributed systems.',
      location: 'San Francisco Convention Center, CA',
      startsAt: '2026-11-15T09:00:00.000Z',
      endsAt: '2026-11-15T18:00:00.000Z',
      capacity: 250,
      ticketsCount: 42,
      status: 'PUBLISHED',
      organizerId: 'org-1',
      createdAt: '2026-10-29T00:00:00.000Z',
      updatedAt: '2026-10-29T00:00:00.000Z',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(
            (ref) => _MockAuthController(),
          ),
          eventsControllerProvider.overrideWith(
            (ref) => _MockEventsController([mockEvent]),
          ),
        ],
        child: const EventPassApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('EventPass'), findsOneWidget);
    expect(find.text('Global Tech Summit 2026'), findsOneWidget);
    expect(find.text('San Francisco Convention Center, CA'), findsOneWidget);
  });
}

class _MockAuthController extends StateNotifier<AsyncValue<User?>> implements AuthController {
  _MockAuthController() : super(const AsyncValue.data(null));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _MockEventsController extends StateNotifier<EventsState> implements EventsController {
  _MockEventsController(List<Event> events)
      : super(EventsState(events: events, isLoading: false, isRefreshing: false));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

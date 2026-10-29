import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/app.dart';
import 'package:eventpass_mobile/features/auth/data/models/user.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';

void main() {
  testWidgets('EventPassApp mounts and renders Events screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(
            (ref) => _MockAuthController(),
          ),
        ],
        child: const EventPassApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('EventPass'), findsOneWidget);
    expect(find.text('Explore Premier Events'), findsOneWidget);
    expect(find.text('Browsing as Guest'), findsOneWidget);
  });
}

class _MockAuthController extends StateNotifier<AsyncValue<User?>> implements AuthController {
  _MockAuthController() : super(const AsyncValue.data(null));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

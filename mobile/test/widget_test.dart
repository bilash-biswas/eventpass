import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/app.dart';

void main() {
  testWidgets('EventPassApp mounts and displays title smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: EventPassApp(),
      ),
    );

    expect(find.text('EventPass'), findsOneWidget);
    expect(find.text('Scaffold Initialized Successfully'), findsOneWidget);
  });
}

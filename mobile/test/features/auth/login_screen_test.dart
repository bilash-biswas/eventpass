import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eventpass_mobile/features/auth/data/models/user.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:eventpass_mobile/features/auth/presentation/screens/login_screen.dart';

class _FakeAuthController extends StateNotifier<AsyncValue<User?>>
    implements AuthController {
  _FakeAuthController() : super(const AsyncValue.data(null));

  String? capturedEmail;
  String? capturedPassword;

  @override
  Future<void> checkAuthStatus() async {}

  @override
  Future<void> login(String email, String password) async {
    capturedEmail = email;
    capturedPassword = password;
  }

  @override
  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {}

  @override
  Future<void> logout() async {}

  @override
  void resetState() {
    state = const AsyncValue.data(null);
  }
}

void main() {
  late _FakeAuthController fakeAuthController;

  setUp(() {
    fakeAuthController = _FakeAuthController();
  });

  Widget buildTestWidget() {
    return ProviderScope(
      overrides: [
        authControllerProvider.overrideWith((ref) => fakeAuthController),
      ],
      child: const MaterialApp(
        home: LoginScreen(),
      ),
    );
  }

  testWidgets('LoginScreen renders email, password fields and sign-in button',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pump();

    expect(find.text('Welcome to EventPass'), findsOneWidget);
    expect(find.text('EMAIL ADDRESS'), findsOneWidget);
    expect(find.text('PASSWORD'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Sign In'), findsOneWidget);
    expect(find.text('Organizer'), findsOneWidget);
    expect(find.text('Attendee'), findsOneWidget);
  });

  testWidgets('LoginScreen displays validation errors on empty submit',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pump();

    // Tap Sign In with empty fields
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    // Verify validation errors
    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('LoginScreen displays format validation errors for invalid inputs',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pump();

    // Enter invalid email and short password
    await tester.enterText(
      find.widgetWithText(TextFormField, '').first,
      'invalid-email-format',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, '').last,
      'short',
    );

    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Password must be at least 8 characters'), findsOneWidget);
  });

  testWidgets('LoginScreen demo quick-fill buttons populate credentials',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pump();

    // Tap Organizer demo button
    await tester.tap(find.text('Organizer'));
    await tester.pump();

    // Verify email field is filled with organizer demo account
    expect(find.text('organizer@eventpass.io'), findsOneWidget);

    // Tap Attendee demo button
    await tester.tap(find.text('Attendee'));
    await tester.pump();

    // Verify email field is updated with attendee demo account
    expect(find.text('user1@eventpass.io'), findsOneWidget);
  });

  testWidgets('LoginScreen submits credentials on valid form',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pump();

    // Use quick-fill to populate valid credentials
    await tester.tap(find.text('Organizer'));
    await tester.pump();

    // Submit form
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    expect(fakeAuthController.capturedEmail, 'organizer@eventpass.io');
    expect(fakeAuthController.capturedPassword, 'Password123!');
  });
}

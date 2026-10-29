import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eventpass_mobile/core/api/api_client.dart';
import 'package:eventpass_mobile/features/auth/data/auth_repository.dart';
import 'package:eventpass_mobile/features/auth/data/models/user.dart';

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<User?>>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final controller = AuthController(repository);

  // Listen to unauthenticated events triggered by 401 refresh failures in Dio
  ref.listen<int>(unauthenticatedEventProvider, (_, __) {
    controller.resetState();
  });

  return controller;
});

class AuthController extends StateNotifier<AsyncValue<User?>> {
  final AuthRepository _repository;

  AuthController(this._repository) : super(const AsyncValue.loading()) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    try {
      final user = await _repository.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _repository.login(email, password);
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    state = const AsyncValue.loading();
    try {
      final response = await _repository.register(
        name: name,
        email: email,
        password: password,
        role: role,
      );
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    await _repository.logout();
    state = const AsyncValue.data(null);
  }

  void resetState() {
    state = const AsyncValue.data(null);
  }
}

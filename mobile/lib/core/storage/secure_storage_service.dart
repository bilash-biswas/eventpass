import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  const storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  return SecureStorageService(storage);
});

/// Type-safe wrapper around [FlutterSecureStorage] for JWT credentials and user session data.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService(this._storage);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.accessTokenKey, value: accessToken),
      _storage.write(key: AppConstants.refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> saveUserSession({
    required String id,
    required String name,
    required String email,
    required String role,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.userIdKey, value: id),
      _storage.write(key: AppConstants.userNameKey, value: name),
      _storage.write(key: AppConstants.userEmailKey, value: email),
      _storage.write(key: AppConstants.userRoleKey, value: role),
    ]);
  }

  Future<String?> getUserRole() async {
    return _storage.read(key: AppConstants.userRoleKey);
  }

  Future<String?> getUserId() async {
    return _storage.read(key: AppConstants.userIdKey);
  }

  Future<String?> getUserName() async {
    return _storage.read(key: AppConstants.userNameKey);
  }

  Future<String?> getUserEmail() async {
    return _storage.read(key: AppConstants.userEmailKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

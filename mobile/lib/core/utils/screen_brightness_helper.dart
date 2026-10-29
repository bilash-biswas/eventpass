import 'dart:developer' as developer;
import 'package:screen_brightness/screen_brightness.dart';

/// Helper utility for temporarily boosting screen brightness to 100%
/// while presenting a QR code pass, then restoring the user's prior level.
class ScreenBrightnessHelper {
  ScreenBrightnessHelper._();

  static bool _isBoosted = false;

  /// Elevates screen brightness to maximum (1.0) for clear gate scanner readability.
  static Future<void> boostBrightness() async {
    try {
      if (!_isBoosted) {
        await ScreenBrightness().setApplicationScreenBrightness(1.0);
        _isBoosted = true;
      }
    } catch (e) {
      developer.log(
        'Screen brightness boost ignored/unsupported on this platform: $e',
        name: 'ScreenBrightnessHelper',
      );
    }
  }

  /// Restores screen brightness to user/system default.
  static Future<void> restoreBrightness() async {
    try {
      if (_isBoosted) {
        await ScreenBrightness().resetApplicationScreenBrightness();
        _isBoosted = false;
      }
    } catch (e) {
      developer.log(
        'Screen brightness reset ignored/unsupported on this platform: $e',
        name: 'ScreenBrightnessHelper',
      );
    }
  }
}

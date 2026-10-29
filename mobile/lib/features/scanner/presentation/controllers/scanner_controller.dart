import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/check_in_result.dart';
import '../../data/scanner_repository.dart';

class ScannerState {
  final bool isProcessing;
  final CheckInResult? lastResult;
  final bool isTorchOn;

  const ScannerState({
    this.isProcessing = false,
    this.lastResult,
    this.isTorchOn = false,
  });

  ScannerState copyWith({
    bool? isProcessing,
    CheckInResult? lastResult,
    bool clearLastResult = false,
    bool? isTorchOn,
  }) {
    return ScannerState(
      isProcessing: isProcessing ?? this.isProcessing,
      lastResult: clearLastResult ? null : (lastResult ?? this.lastResult),
      isTorchOn: isTorchOn ?? this.isTorchOn,
    );
  }
}

class ScannerController extends StateNotifier<ScannerState> {
  final ScannerRepository _repository;

  ScannerController(this._repository) : super(const ScannerState());

  /// Atomically processes a scanned QR code with a strict concurrency lock.
  /// Prevents duplicate triggers from identical frames during camera acquisition.
  Future<CheckInResult?> processScan(String rawCode) async {
    final trimmed = rawCode.trim();
    if (trimmed.isEmpty || state.isProcessing) {
      return null;
    }

    // Acquire scan concurrency lock
    state = state.copyWith(isProcessing: true);

    try {
      final result = await _repository.checkIn(trimmed);

      // Trigger distinct physical haptic feedback based on gate check-in status
      if (result.isSuccess) {
        await HapticFeedback.mediumImpact();
      } else {
        await HapticFeedback.heavyImpact();
      }

      state = state.copyWith(
        isProcessing: false,
        lastResult: result,
      );

      return result;
    } catch (_) {
      await HapticFeedback.heavyImpact();
      final fallbackResult = CheckInResult(
        status: CheckInStatus.error,
        statusCode: 500,
        message: 'Gate check-in failed due to unexpected error.',
        scannedCode: trimmed,
      );

      state = state.copyWith(
        isProcessing: false,
        lastResult: fallbackResult,
      );
      return fallbackResult;
    }
  }

  /// Resumes the scanner and clears the previous result modal.
  void resumeScanning() {
    state = state.copyWith(
      isProcessing: false,
      clearLastResult: true,
    );
  }

  void toggleTorch() {
    state = state.copyWith(isTorchOn: !state.isTorchOn);
  }
}

final scannerControllerProvider =
    StateNotifierProvider<ScannerController, ScannerState>((ref) {
  final repository = ref.watch(scannerRepositoryProvider);
  return ScannerController(repository);
});

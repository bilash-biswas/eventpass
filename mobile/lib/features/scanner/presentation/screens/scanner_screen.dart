import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/theme/app_theme.dart';
import '../controllers/scanner_controller.dart';
import '../widgets/scan_result_sheet.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  late final MobileScannerController _scannerController;
  final TextEditingController _manualCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      autoStart: true,
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleBarcodeDetected(BarcodeCapture capture) async {
    final state = ref.read(scannerControllerProvider);
    if (state.isProcessing) return;

    final barcode = capture.barcodes.firstOrNull;
    final rawCode = barcode?.rawValue;

    if (rawCode == null || rawCode.trim().isEmpty) return;

    final result = await ref
        .read(scannerControllerProvider.notifier)
        .processScan(rawCode);

    if (result != null && mounted) {
      await ScanResultSheet.show(
        context,
        result,
        onDismiss: () {
          ref.read(scannerControllerProvider.notifier).resumeScanning();
        },
      );
    }
  }

  Future<void> _openManualEntryDialog() async {
    _manualCodeController.clear();
    final enteredCode = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Manual Ticket Entry'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the alphanumeric ticket code printed or displayed on the admission pass:',
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _manualCodeController,
              autofocus: true,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                hintText: 'e.g. EVT-ABCD-1234',
                prefixIcon: Icon(Icons.confirmation_number_outlined),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = _manualCodeController.text.trim();
              if (text.isNotEmpty) {
                Navigator.of(ctx).pop(text);
              }
            },
            child: const Text('Verify & Check In'),
          ),
        ],
      ),
    );

    if (enteredCode != null && enteredCode.isNotEmpty && mounted) {
      final result = await ref
          .read(scannerControllerProvider.notifier)
          .processScan(enteredCode);

      if (result != null && mounted) {
        await ScanResultSheet.show(
          context,
          result,
          onDismiss: () {
            ref.read(scannerControllerProvider.notifier).resumeScanning();
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scannerControllerProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          'Gate Check-In Scanner',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          // Torch toggle
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _scannerController,
            builder: (context, scannerState, child) {
              final isTorchOn = scannerState.torchState == TorchState.on;
              return IconButton(
                icon: Icon(
                  isTorchOn ? Icons.flash_on : Icons.flash_off,
                  color: isTorchOn ? Colors.amber : Colors.white,
                ),
                tooltip: 'Toggle Flashlight',
                onPressed: () => _scannerController.toggleTorch(),
              );
            },
          ),
          // Camera switch
          IconButton(
            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            tooltip: 'Flip Camera',
            onPressed: () => _scannerController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          MobileScanner(
            controller: _scannerController,
            onDetect: _handleBarcodeDetected,
          ),

          // Reticle Scanner Overlay
          _buildScannerOverlay(context),

          // Processing Indicator
          if (state.isProcessing)
            Container(
              color: Colors.black.withAlpha(150),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Verifying gate admission...',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Manual Entry Bottom Bar
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Center(
              child: ElevatedButton.icon(
                onPressed: _openManualEntryDialog,
                icon: const Icon(Icons.keyboard, size: 20),
                label: const Text(
                  'Enter Code Manually',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white.withAlpha(220),
                  foregroundColor: const Color(0xFF0F172A),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScannerOverlay(BuildContext context) {
    const scanBoxSize = 260.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final screenHeight = constraints.maxHeight;

        final left = (screenWidth - scanBoxSize) / 2;
        final top = (screenHeight - scanBoxSize) / 2 - 40;

        return Stack(
          children: [
            // Darkened cutout surrounding frame
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Colors.black.withAlpha(160),
                BlendMode.srcOut,
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.transparent,
                    ),
                  ),
                  Positioned(
                    left: left,
                    top: top,
                    child: Container(
                      width: scanBoxSize,
                      height: scanBoxSize,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Corner Reticle Brackets
            Positioned(
              left: left,
              top: top,
              child: SizedBox(
                width: scanBoxSize,
                height: scanBoxSize,
                child: CustomPaint(
                  painter: _ScannerReticlePainter(
                    reticleColor: AppTheme.primaryColor,
                    strokeWidth: 4.0,
                    cornerLength: 32.0,
                  ),
                ),
              ),
            ),

            // Instructional text below scanner window
            Positioned(
              top: top + scanBoxSize + 24,
              left: 24,
              right: 24,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withAlpha(180),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.qr_code_scanner,
                          color: Colors.white70,
                          size: 16,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Align attendee QR pass inside frame',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ScannerReticlePainter extends CustomPainter {
  final Color reticleColor;
  final double strokeWidth;
  final double cornerLength;

  _ScannerReticlePainter({
    required this.reticleColor,
    required this.strokeWidth,
    required this.cornerLength,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = reticleColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;
    const r = 20.0; // corner radius offset

    // Top-Left corner
    canvas.drawLine(Offset(0, r + cornerLength), const Offset(0, r), paint);
    canvas.drawLine(const Offset(0, r), const Offset(r, 0), paint);
    canvas.drawLine(const Offset(r, 0), Offset(r + cornerLength, 0), paint);

    // Top-Right corner
    canvas.drawLine(Offset(w - (r + cornerLength), 0), Offset(w - r, 0), paint);
    canvas.drawLine(Offset(w - r, 0), Offset(w, r), paint);
    canvas.drawLine(Offset(w, r), Offset(w, r + cornerLength), paint);

    // Bottom-Left corner
    canvas.drawLine(Offset(0, h - (r + cornerLength)), Offset(0, h - r), paint);
    canvas.drawLine(Offset(0, h - r), Offset(r, h), paint);
    canvas.drawLine(Offset(r, h), Offset(r + cornerLength, h), paint);

    // Bottom-Right corner
    canvas.drawLine(Offset(w - (r + cornerLength), h), Offset(w - r, h), paint);
    canvas.drawLine(Offset(w - r, h), Offset(w, h - r), paint);
    canvas.drawLine(Offset(w, h - r), Offset(w, h - (r + cornerLength)), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

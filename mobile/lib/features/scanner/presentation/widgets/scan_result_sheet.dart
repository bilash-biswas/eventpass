import 'package:flutter/material.dart';
import 'package:eventpass_mobile/core/theme/app_theme.dart';
import 'package:eventpass_mobile/core/utils/date_formatter.dart';
import 'package:eventpass_mobile/features/scanner/data/models/check_in_result.dart';

class ScanResultSheet extends StatelessWidget {
  final CheckInResult result;
  final VoidCallback onDismiss;

  const ScanResultSheet({
    super.key,
    required this.result,
    required this.onDismiss,
  });

  static Future<void> show(
    BuildContext context,
    CheckInResult result, {
    required VoidCallback onDismiss,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ScanResultSheet(
        result: result,
        onDismiss: () {
          Navigator.of(ctx).pop();
          onDismiss();
        },
      ),
    ).then((_) => onDismiss());
  }

  @override
  Widget build(BuildContext context) {
    final ticket = result.ticket;
    final attendee = ticket?.user;
    final event = ticket?.event;

    Color primaryColor;
    IconData statusIcon;
    String title;
    String subtitle;

    switch (result.status) {
      case CheckInStatus.success:
        primaryColor = AppTheme.successColor;
        statusIcon = Icons.check_circle_rounded;
        title = 'Check-In Approved!';
        subtitle = 'Attendee entry has been recorded in database.';
        break;
      case CheckInStatus.alreadyUsed:
        primaryColor = AppTheme.warningColor;
        statusIcon = Icons.warning_amber_rounded;
        title = 'Already Checked In';
        subtitle = 'This ticket has previously been scanned for entry.';
        break;
      case CheckInStatus.notFound:
        primaryColor = AppTheme.errorColor;
        statusIcon = Icons.cancel_outlined;
        title = 'Invalid Ticket Code';
        subtitle = 'No matching ticket found in database.';
        break;
      case CheckInStatus.unauthorized:
        primaryColor = AppTheme.errorColor;
        statusIcon = Icons.lock_outline;
        title = 'Unauthorized Event';
        subtitle = 'You are not authorized to check in tickets for this event.';
        break;
      case CheckInStatus.cancelled:
        primaryColor = AppTheme.errorColor;
        statusIcon = Icons.block;
        title = 'Ticket Cancelled';
        subtitle = 'This ticket RSVP was cancelled by the attendee.';
        break;
      case CheckInStatus.error:
        primaryColor = AppTheme.errorColor;
        statusIcon = Icons.error_outline;
        title = 'Check-In Failed';
        subtitle = result.message;
        break;
    }

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          // Status Icon Circle
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: primaryColor.withAlpha(25),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, size: 54, color: primaryColor),
          ),
          const SizedBox(height: 16),

          // Title & Subtitle
          Text(
            title,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: primaryColor,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 20),

          // Detail Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (attendee != null) ...[
                  _buildDetailRow(
                    icon: Icons.person_outline,
                    label: 'ATTENDEE',
                    value: attendee.name,
                  ),
                  const SizedBox(height: 10),
                  _buildDetailRow(
                    icon: Icons.email_outlined,
                    label: 'EMAIL',
                    value: attendee.email,
                  ),
                  const SizedBox(height: 10),
                ],
                if (event != null) ...[
                  _buildDetailRow(
                    icon: Icons.event_outlined,
                    label: 'EVENT',
                    value: event.title,
                  ),
                  const SizedBox(height: 10),
                ],
                _buildDetailRow(
                  icon: Icons.qr_code,
                  label: 'TICKET CODE',
                  value: result.scannedCode ?? ticket?.code ?? 'N/A',
                  isMonospace: true,
                ),
                if (result.checkedInAt != null) ...[
                  const SizedBox(height: 10),
                  _buildDetailRow(
                    icon: Icons.access_time,
                    label: 'CHECKED IN AT',
                    value: DateFormatter.formatFullDate(
                      DateTime.parse(result.checkedInAt!),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Primary Scan Next Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onDismiss,
              icon: const Icon(Icons.qr_code_scanner, size: 20),
              label: const Text(
                'Scan Next Attendee',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    bool isMonospace = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF64748B)),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                  fontFamily: isMonospace ? 'monospace' : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

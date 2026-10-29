import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../data/models/ticket.dart';
import '../controllers/tickets_controller.dart';
import 'ticket_pass_modal.dart';

class TicketCard extends ConsumerWidget {
  final Ticket ticket;
  final VoidCallback? onCancelled;

  const TicketCard({
    super.key,
    required this.ticket,
    this.onCancelled,
  });

  void _copyTicketCode(BuildContext context) {
    Clipboard.setData(ClipboardData(text: ticket.code));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Ticket code copied to clipboard!'),
        backgroundColor: AppTheme.primaryColor,
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _confirmCancel(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Ticket RSVP?'),
        content: Text(
          'Are you sure you want to cancel your ticket for "${ticket.event?.title ?? 'this event'}"?\n\n'
          'Your spot will be released immediately so another attendee may register.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep Ticket'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm Cancellation'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref
          .read(ticketsControllerProvider.notifier)
          .cancelTicket(ticket.id, ticket.eventId);

      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ticket RSVP cancelled successfully.'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          onCancelled?.call();
        } else {
          final error = ref.read(ticketsControllerProvider).errorMessage;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error ?? 'Failed to cancel ticket.'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final event = ticket.event;
    final state = ref.watch(ticketsControllerProvider);
    final isCancelling = state.cancellingTicketId == ticket.id;
    final isValid = ticket.status == 'VALID';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Stub Section: Event Details & Status
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        event?.title ?? 'Event Ticket',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildStatusBadge(ticket.status),
                  ],
                ),
                const SizedBox(height: 12),

                // Date & Time
                if (event != null) ...[
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 15,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          DateFormatter.formatDateRange(
                            DateTime.parse(event.startsAt),
                            DateTime.parse(event.endsAt),
                          ),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF334155),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 15,
                        color: Color(0xFF64748B),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.location,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Perforated divider line with circular side notches
          _buildPerforationDivider(context),

          // Bottom Stub Section: QR Code, Pass Code & Actions
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // QR Code box (tap to open full pass modal with brightness boost)
                    GestureDetector(
                      onTap: () => TicketPassModal.show(context, ticket),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            QrImageView(
                              data: ticket.code,
                              version: QrVersions.auto,
                              size: 88.0,
                              backgroundColor: Colors.white,
                              eyeStyle: const QrEyeStyle(
                                eyeShape: QrEyeShape.square,
                                color: Color(0xFF0F172A),
                              ),
                              dataModuleStyle: const QrDataModuleStyle(
                                dataModuleShape: QrDataModuleShape.square,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            if (!isValid)
                              Container(
                                width: 88,
                                height: 88,
                                color: Colors.white.withAlpha(200),
                                child: Center(
                                  child: Icon(
                                    ticket.status == 'CHECKED_IN'
                                        ? Icons.check_circle
                                        : Icons.block,
                                    size: 32,
                                    color: ticket.status == 'CHECKED_IN'
                                        ? const Color(0xFF2563EB)
                                        : AppTheme.errorColor,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Code Details & Copy
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TICKET CODE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF94A3B8),
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ticket.code,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              OutlinedButton.icon(
                                onPressed: () => _copyTicketCode(context),
                                icon: const Icon(Icons.copy, size: 14),
                                label: const Text('Copy', style: TextStyle(fontSize: 12)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  minimumSize: const Size(0, 32),
                                ),
                              ),
                              const SizedBox(width: 8),
                              FilledButton.tonalIcon(
                                onPressed: () => TicketPassModal.show(context, ticket),
                                icon: const Icon(Icons.fullscreen, size: 15),
                                label: const Text('Pass', style: TextStyle(fontSize: 12)),
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  minimumSize: const Size(0, 32),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Check-in or Cancellation note
                if (ticket.status == 'CHECKED_IN' && ticket.checkedInAt != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          size: 16,
                          color: Color(0xFF2563EB),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Checked in at ${DateFormatter.formatFullDate(DateTime.parse(ticket.checkedInAt!))}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF1E40AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Valid Ticket Cancellation Option
                if (isValid) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Unable to attend?',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      TextButton.icon(
                        onPressed: isCancelling
                            ? null
                            : () => _confirmCancel(context, ref),
                        icon: isCancelling
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.cancel_outlined, size: 14, color: AppTheme.errorColor),
                        label: Text(
                          isCancelling ? 'Cancelling...' : 'Cancel RSVP',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.errorColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerforationDivider(BuildContext context) {
    const notchRadius = 10.0;
    const notchColor = Color(0xFFF8FAFC); // matches scaffold background

    return Stack(
      alignment: Alignment.center,
      children: [
        // Dashed Divider line
        Row(
          children: List.generate(
            30,
            (index) => Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                height: 1.5,
                color: index.isEven ? const Color(0xFFCBD5E1) : Colors.transparent,
              ),
            ),
          ),
        ),

        // Left Notch
        Positioned(
          left: -notchRadius,
          child: Container(
            width: notchRadius * 2,
            height: notchRadius * 2,
            decoration: BoxDecoration(
              color: notchColor,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
          ),
        ),

        // Right Notch
        Positioned(
          right: -notchRadius,
          child: Container(
            width: notchRadius * 2,
            height: notchRadius * 2,
            decoration: BoxDecoration(
              color: notchColor,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;

    switch (status.toUpperCase()) {
      case 'VALID':
        bg = AppTheme.successColor.withAlpha(25);
        fg = AppTheme.successColor;
        label = 'VALID';
        break;
      case 'CHECKED_IN':
        bg = const Color(0xFF3B82F6).withAlpha(25);
        fg = const Color(0xFF2563EB);
        label = 'CHECKED IN';
        break;
      case 'CANCELLED':
        bg = AppTheme.errorColor.withAlpha(25);
        fg = AppTheme.errorColor;
        label = 'CANCELLED';
        break;
      default:
        bg = const Color(0xFF64748B).withAlpha(25);
        fg = const Color(0xFF64748B);
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: fg,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

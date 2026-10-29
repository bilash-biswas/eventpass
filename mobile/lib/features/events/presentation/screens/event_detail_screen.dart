import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:eventpass_mobile/core/theme/app_theme.dart';
import 'package:eventpass_mobile/core/utils/date_formatter.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';
import '../../data/events_repository.dart';
import '../controllers/event_detail_controller.dart';

class EventDetailScreen extends ConsumerStatefulWidget {
  final String slug;

  const EventDetailScreen({super.key, required this.slug});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  bool _isRsvping = false;
  String? _rsvpError;

  Future<void> _handleRsvp(String eventId) async {
    final user = ref.read(authControllerProvider).valueOrNull;
    if (user == null) {
      context.push('/login');
      return;
    }

    setState(() {
      _isRsvping = true;
      _rsvpError = null;
    });

    try {
      final repository = ref.read(eventsRepositoryProvider);
      await repository.rsvpToEvent(eventId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('RSVP confirmed! Your digital admission pass has been issued.'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        context.push('/my-tickets');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _rsvpError = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isRsvping = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final eventAsync = ref.watch(eventDetailProvider(widget.slug));
    final authState = ref.watch(authControllerProvider);
    final user = authState.valueOrNull;

    return Scaffold(
      body: eventAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Scaffold(
          appBar: AppBar(),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
                  const SizedBox(height: 12),
                  const Text('Event Not Found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(err.toString(), textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.pop(),
                    child: const Text('Go Back'),
                  ),
                ],
              ),
            ),
          ),
        ),
        data: (event) {
          final startsAt = DateTime.tryParse(event.startsAt) ?? DateTime.now();
          final endsAt = DateTime.tryParse(event.endsAt) ?? DateTime.now();
          final isPast = DateFormatter.isEventPast(endsAt);
          final booked = event.ticketsCount ?? 0;
          final spotsLeft = (event.capacity - booked).clamp(0, event.capacity);
          final isSoldOut = spotsLeft == 0;
          final percent = (booked / (event.capacity > 0 ? event.capacity : 1)).clamp(0.0, 1.0);

          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  // Sliver App Bar with Cover Banner
                  SliverAppBar(
                    expandedHeight: 240,
                    pinned: true,
                    leading: CircleAvatar(
                      backgroundColor: Colors.white.withAlpha(200),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
                        onPressed: () => context.pop(),
                      ),
                    ),
                    flexibleSpace: FlexibleSpaceBar(
                      background: event.coverImageUrl != null && event.coverImageUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: event.coverImageUrl!,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => _buildFallbackBanner(),
                            )
                          : _buildFallbackBanner(),
                    ),
                  ),

                  // Event Content
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Text(
                            event.title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.5,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Host Info
                          if (event.organizer != null) ...[
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppTheme.primaryColor.withAlpha(25),
                                  child: const Icon(Icons.person, color: AppTheme.primaryColor, size: 20),
                                ),
                                const SizedBox(width: 10),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Hosted by', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    Text(
                                      event.organizer!.name,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Date & Time Card
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor.withAlpha(20),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.calendar_today_outlined, color: AppTheme.primaryColor, size: 22),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('DATE AND TIME', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                                      const SizedBox(height: 2),
                                      Text(
                                        DateFormatter.formatDateRange(startsAt, endsAt),
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Location Card
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor.withAlpha(20),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.location_on_outlined, color: AppTheme.primaryColor, size: 22),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('LOCATION / VENUE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                                      const SizedBox(height: 2),
                                      Text(
                                        event.location,
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Capacity Metrics
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Reserved Capacity', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              Text(
                                '$booked / ${event.capacity} ($spotsLeft spots left)',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: percent,
                              minHeight: 8,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                isSoldOut
                                    ? AppTheme.errorColor
                                    : spotsLeft <= 10
                                        ? AppTheme.warningColor
                                        : AppTheme.primaryColor,
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),

                          // Description
                          const Text(
                            'About this Event',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            event.description,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF334155),
                              height: 1.6,
                            ),
                          ),

                          // Error banner if RSVP failed
                          if (_rsvpError != null) ...[
                            const SizedBox(height: 20),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.errorColor.withAlpha(20),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.errorColor.withAlpha(50)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _rsvpError!,
                                      style: const TextStyle(color: AppTheme.errorColor, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Sticky Bottom RSVP Action Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(15),
                        blurRadius: 10,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ADMISSION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                          Text(
                            'Free Entry',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isSoldOut ? const Color(0xFF94A3B8) : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: isPast || isSoldOut || _isRsvping
                              ? null
                              : () => _handleRsvp(event.id),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isSoldOut
                                ? const Color(0xFFCBD5E1)
                                : AppTheme.primaryColor,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: _isRsvping
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Text(
                                  isPast
                                      ? 'Event Concluded'
                                      : isSoldOut
                                          ? 'Sold Out'
                                          : user == null
                                              ? 'Sign In to RSVP'
                                              : 'RSVP for Free',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFallbackBanner() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E3A8A), Color(0xFF2563EB)],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.confirmation_number_outlined, size: 64, color: Colors.white30),
      ),
    );
  }
}

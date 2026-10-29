import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../data/models/event.dart';

class EventCard extends StatelessWidget {
  final Event event;

  const EventCard({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final startsAt = DateTime.tryParse(event.startsAt) ?? DateTime.now();
    final endsAt = DateTime.tryParse(event.endsAt) ?? DateTime.now();
    final isPast = DateFormatter.isEventPast(endsAt);
    final booked = event.ticketsCount ?? 0;
    final spotsLeft = (event.capacity - booked).clamp(0, event.capacity);
    final isSoldOut = spotsLeft == 0;
    final percent = (booked / (event.capacity > 0 ? event.capacity : 1)).clamp(0.0, 1.0);

    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => context.push('/events/${event.slug}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image Banner with Overlays
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: event.coverImageUrl != null && event.coverImageUrl!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: event.coverImageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: const Color(0xFFE2E8F0)),
                          errorWidget: (_, __, ___) => _buildFallbackBanner(),
                        )
                      : _buildFallbackBanner(),
                ),

                // Date Overlay Badge (Top Left)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(240),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(20),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          DateFormatter.getMonthBadge(startsAt),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        Text(
                          DateFormatter.getDayBadge(startsAt),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            height: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Capacity / Status Badge (Top Right)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isPast
                          ? const Color(0xFF64748B)
                          : isSoldOut
                              ? AppTheme.errorColor
                              : spotsLeft <= 10
                                  ? AppTheme.warningColor
                                  : Colors.black.withAlpha(180),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isPast
                          ? 'Past Event'
                          : isSoldOut
                              ? 'Sold Out'
                              : spotsLeft <= 10
                                  ? 'Only $spotsLeft left'
                                  : '$spotsLeft spots',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Event Details Padding
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.3,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Date and Time Row
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 15, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          DateFormatter.formatDateRange(startsAt, endsAt),
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Location Row
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 15, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.location,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Capacity Progress Bar
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Capacity ($booked/${event.capacity})',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                      Text(
                        '${(percent * 100).toInt()}%',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: percent,
                      minHeight: 5,
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackBanner() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF2563EB), Color(0xFF3B82F6)],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.event_outlined,
          color: Colors.white38,
          size: 48,
        ),
      ),
    );
  }
}

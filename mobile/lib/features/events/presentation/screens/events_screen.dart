import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:eventpass_mobile/core/theme/app_theme.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';
import '../controllers/events_controller.dart';
import '../widgets/event_card.dart';
import '../widgets/event_search_bar.dart';

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.valueOrNull;
    final eventsState = ref.watch(eventsControllerProvider);
    final controller = ref.read(eventsControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.confirmation_number_outlined, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 8),
            const Text('EventPass', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          if (user != null) ...[
            if (user.role == 'ORGANIZER' || user.role == 'ADMIN')
              IconButton(
                icon: const Icon(Icons.qr_code_scanner, color: AppTheme.primaryColor),
                tooltip: 'Scan Attendee Tickets',
                onPressed: () => context.push('/scanner'),
              ),
            IconButton(
              icon: const Icon(Icons.confirmation_number_outlined),
              tooltip: 'My Tickets Wallet',
              onPressed: () => context.push('/my-tickets'),
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'logout') {
                  ref.read(authControllerProvider.notifier).logout();
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  enabled: false,
                  child: Text(
                    '${user.name}\n${user.email}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, size: 18, color: AppTheme.errorColor),
                      SizedBox(width: 8),
                      Text('Sign Out', style: TextStyle(color: AppTheme.errorColor)),
                    ],
                  ),
                ),
              ],
              child: Padding(
                padding: const EdgeInsets.only(right: 12, left: 4),
                child: CircleAvatar(
                  radius: 14,
                  backgroundColor: AppTheme.primaryColor.withAlpha(30),
                  child: Text(
                    user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ] else ...[
            TextButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ],
      ),
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: CustomScrollView(
          slivers: [
            // Search Bar Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: EventSearchBar(
                  initialValue: eventsState.search,
                  onSearch: controller.search,
                ),
              ),
            ),

            // Error State
            if (eventsState.error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
                        const SizedBox(height: 12),
                        const Text(
                          'Failed to load events',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          eventsState.error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => controller.loadEvents(refresh: true),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )

            // Loading Shimmer/Spinner
            else if (eventsState.isLoading && eventsState.events.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              )

            // Empty State
            else if (eventsState.events.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.event_busy_outlined, size: 56, color: Color(0xFF94A3B8)),
                        const SizedBox(height: 14),
                        const Text(
                          'No Events Found',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'No published events match your query. Try clearing your search.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: () => controller.search(''),
                          child: const Text('Reset Search'),
                        ),
                      ],
                    ),
                  ),
                ),
              )

            // Events List
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final event = eventsState.events[index];
                      return EventCard(event: event);
                    },
                    childCount: eventsState.events.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

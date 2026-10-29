import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/ticket.dart';
import '../controllers/tickets_controller.dart';
import '../widgets/ticket_card.dart';

class MyTicketsScreen extends ConsumerStatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  ConsumerState<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends ConsumerState<MyTicketsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ticketsControllerProvider);
    final controller = ref.read(ticketsControllerProvider.notifier);

    final activeTickets = state.activeTickets;
    final pastTickets = state.pastTickets;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets & Passes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Tickets',
            onPressed: () => controller.refresh(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Active Passes'),
                  if (activeTickets.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _buildCountBadge(activeTickets.length, isPrimary: true),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Past & Concluded'),
                  if (pastTickets.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _buildCountBadge(pastTickets.length, isPrimary: false),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: state.isLoading && state.tickets.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.errorMessage != null && state.tickets.isEmpty
              ? _buildErrorView(state.errorMessage!, controller.loadTickets)
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // Active Passes Tab
                    _buildTicketsList(
                      tickets: activeTickets,
                      emptyTitle: 'No Active Tickets',
                      emptySubtitle:
                          "You haven't registered for any upcoming events yet. Discover exciting tech meetups, hackathons, and conferences now!",
                      actionLabel: 'Browse Events',
                      onAction: () => context.go('/events'),
                      onRefresh: controller.refresh,
                    ),

                    // Past Passes Tab
                    _buildTicketsList(
                      tickets: pastTickets,
                      emptyTitle: 'No Past Tickets',
                      emptySubtitle:
                          'Your completed, checked-in, or cancelled admission passes will be archived here.',
                      actionLabel: 'Explore Events',
                      onAction: () => context.go('/events'),
                      onRefresh: controller.refresh,
                    ),
                  ],
                ),
    );
  }

  Widget _buildCountBadge(int count, {required bool isPrimary}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: isPrimary
            ? AppTheme.primaryColor.withAlpha(25)
            : const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isPrimary ? AppTheme.primaryColor : const Color(0xFF475569),
        ),
      ),
    );
  }

  Widget _buildTicketsList({
    required List<Ticket> tickets,
    required String emptyTitle,
    required String emptySubtitle,
    required String actionLabel,
    required VoidCallback onAction,
    required Future<void> Function() onRefresh,
  }) {
    if (tickets.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withAlpha(15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.confirmation_number_outlined,
                          size: 48,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        emptyTitle,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        emptySubtitle,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: onAction,
                        icon: const Icon(Icons.search, size: 18),
                        label: Text(actionLabel),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: tickets.length,
        itemBuilder: (context, index) {
          return TicketCard(ticket: tickets[index]);
        },
      ),
    );
  }

  Widget _buildErrorView(String message, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
            const SizedBox(height: 12),
            const Text(
              'Failed to Load Tickets',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

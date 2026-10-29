import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:eventpass_mobile/core/theme/app_theme.dart';
import 'package:eventpass_mobile/features/auth/presentation/controllers/auth_controller.dart';

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('EventPass'),
        actions: [
          if (user != null) ...[
            if (user.role == 'ORGANIZER' || user.role == 'ADMIN')
              IconButton(
                icon: const Icon(Icons.qr_code_scanner),
                tooltip: 'Scan Tickets',
                onPressed: () => context.push('/scanner'),
              ),
            IconButton(
              icon: const Icon(Icons.confirmation_number_outlined),
              tooltip: 'My Tickets',
              onPressed: () => context.push('/my-tickets'),
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Sign Out',
              onPressed: () => ref.read(authControllerProvider.notifier).logout(),
            ),
          ] else ...[
            TextButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign In'),
            ),
          ],
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.calendar_month_outlined, size: 64, color: AppTheme.primaryColor),
            const SizedBox(height: 16),
            const Text(
              'Explore Premier Events',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              user != null ? 'Signed in as ${user.name} (${user.role})' : 'Browsing as Guest',
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }
}

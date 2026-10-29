import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/events_repository.dart';
import '../../data/models/event.dart';

final eventDetailProvider =
    FutureProvider.family<Event, String>((ref, slug) async {
  final repository = ref.watch(eventsRepositoryProvider);
  return repository.getEventBySlug(slug);
});

final rsvpLoadingProvider = StateProvider<bool>((ref) => false);

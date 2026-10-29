import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/events_repository.dart';
import '../../data/models/event.dart';

class EventsState {
  final List<Event> events;
  final bool isLoading;
  final bool isRefreshing;
  final String? search;
  final int page;
  final int totalPages;
  final String? error;

  const EventsState({
    this.events = const [],
    this.isLoading = false,
    this.isRefreshing = false,
    this.search,
    this.page = 1,
    this.totalPages = 1,
    this.error,
  });

  EventsState copyWith({
    List<Event>? events,
    bool? isLoading,
    bool? isRefreshing,
    String? search,
    int? page,
    int? totalPages,
    String? error,
  }) {
    return EventsState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      search: search ?? this.search,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      error: error,
    );
  }
}

final eventsControllerProvider =
    StateNotifierProvider<EventsController, EventsState>((ref) {
  final repository = ref.watch(eventsRepositoryProvider);
  return EventsController(repository);
});

class EventsController extends StateNotifier<EventsState> {
  final EventsRepository _repository;

  EventsController(this._repository) : super(const EventsState()) {
    loadEvents();
  }

  Future<void> loadEvents({bool refresh = false}) async {
    if (state.isLoading && !refresh) return;

    final targetPage = refresh ? 1 : state.page;

    state = state.copyWith(
      isLoading: !refresh,
      isRefreshing: refresh,
      error: null,
    );

    try {
      final result = await _repository.getEvents(
        page: targetPage,
        pageSize: 10,
        search: state.search,
      );

      state = state.copyWith(
        events: refresh ? result.items : [...state.events, ...result.items],
        page: targetPage,
        totalPages: result.totalPages,
        isLoading: false,
        isRefreshing: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
        isLoading: false,
        isRefreshing: false,
      );
    }
  }

  void search(String? query) {
    if (state.search == query) return;
    state = state.copyWith(search: query, page: 1);
    loadEvents(refresh: true);
  }

  Future<void> refresh() async {
    await loadEvents(refresh: true);
  }
}

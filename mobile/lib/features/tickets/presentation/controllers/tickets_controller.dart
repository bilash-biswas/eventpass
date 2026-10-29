import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/ticket.dart';
import '../../data/tickets_repository.dart';

class TicketsState {
  final bool isLoading;
  final List<Ticket> tickets;
  final String? errorMessage;
  final String? cancellingTicketId;

  const TicketsState({
    this.isLoading = false,
    this.tickets = const [],
    this.errorMessage,
    this.cancellingTicketId,
  });

  List<Ticket> get activeTickets {
    final now = DateTime.now();
    return tickets.where((ticket) {
      if (ticket.status != 'VALID') return false;
      if (ticket.event != null) {
        final endsAt = DateTime.tryParse(ticket.event!.endsAt);
        if (endsAt != null && endsAt.isBefore(now)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<Ticket> get pastTickets {
    final now = DateTime.now();
    return tickets.where((ticket) {
      if (ticket.status != 'VALID') return true;
      if (ticket.event != null) {
        final endsAt = DateTime.tryParse(ticket.event!.endsAt);
        if (endsAt != null && endsAt.isBefore(now)) {
          return true;
        }
      }
      return false;
    }).toList();
  }

  TicketsState copyWith({
    bool? isLoading,
    List<Ticket>? tickets,
    String? errorMessage,
    bool clearError = false,
    String? cancellingTicketId,
    bool clearCancellingId = false,
  }) {
    return TicketsState(
      isLoading: isLoading ?? this.isLoading,
      tickets: tickets ?? this.tickets,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      cancellingTicketId: clearCancellingId
          ? null
          : (cancellingTicketId ?? this.cancellingTicketId),
    );
  }
}

class TicketsController extends StateNotifier<TicketsState> {
  final TicketsRepository _repository;

  TicketsController(this._repository) : super(const TicketsState()) {
    loadTickets();
  }

  Future<void> loadTickets() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final tickets = await _repository.getMyTickets();
      state = state.copyWith(
        isLoading: false,
        tickets: tickets,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> refresh() async {
    try {
      final tickets = await _repository.getMyTickets();
      state = state.copyWith(
        tickets: tickets,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<bool> cancelTicket(String ticketId, String eventId) async {
    state = state.copyWith(cancellingTicketId: ticketId, clearError: true);
    try {
      await _repository.cancelTicket(eventId);
      
      // Update ticket locally to CANCELLED
      final updatedList = state.tickets.map((t) {
        if (t.id == ticketId) {
          return t.copyWith(status: 'CANCELLED');
        }
        return t;
      }).toList();

      state = state.copyWith(
        tickets: updatedList,
        clearCancellingId: true,
        clearError: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        clearCancellingId: true,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final ticketsControllerProvider =
    StateNotifierProvider<TicketsController, TicketsState>((ref) {
  final repository = ref.watch(ticketsRepositoryProvider);
  return TicketsController(repository);
});

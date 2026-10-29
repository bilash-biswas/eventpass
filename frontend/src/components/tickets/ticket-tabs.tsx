"use client";

import * as React from "react";
import { TicketCheck, History } from "lucide-react";
import { TicketCard } from "./ticket-card";
import { isEventPast } from "@/lib/utils/date";
import type { components } from "@/lib/api/schema";

type Ticket = components["schemas"]["TicketResponseDto"];

interface TicketTabsProps {
  tickets: Ticket[];
}

export function TicketTabs({ tickets }: TicketTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"active" | "history">("active");

  const activeTickets = tickets.filter((t) => {
    const isPast = t.event ? isEventPast(t.event.endsAt) : false;
    return t.status === "VALID" && !isPast;
  });

  const historyTickets = tickets.filter((t) => {
    const isPast = t.event ? isEventPast(t.event.endsAt) : false;
    return t.status !== "VALID" || isPast;
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TicketCheck className="h-4 w-4" />
          <span>Active & Upcoming</span>
          <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
            {activeTickets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Past & Cancelled</span>
          <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-bold">
            {historyTickets.length}
          </span>
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
              <h4 className="font-semibold text-foreground">No upcoming tickets</h4>
              <p className="text-xs text-muted-foreground">
                You do not have any upcoming event passes. Explore published events and RSVP to get started.
              </p>
            </div>
          ) : (
            activeTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </div>
      )}

      {/* History Tab Panel */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {historyTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
              <h4 className="font-semibold text-foreground">No historical tickets</h4>
              <p className="text-xs text-muted-foreground">
                Tickets for past events or cancelled RSVPs will be archived here.
              </p>
            </div>
          ) : (
            historyTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </div>
      )}
    </div>
  );
}

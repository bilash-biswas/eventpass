import type { Metadata } from "next";
import Link from "next/link";
import { CalendarSearch, Sparkles, XCircle } from "lucide-react";
import { getServerApiClient } from "@/lib/api/server-client";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Explore Events — Conferences, Workshops & Meetups",
  description:
    "Browse upcoming technology conferences, developer meetups, and exclusive workshops. RSVP instantly on EventPass.",
};

interface EventsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    from?: string;
    to?: string;
    sort?: "asc" | "desc";
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const pageSize = 9; // 3x3 grid
  const search = resolvedParams.search;
  const from = resolvedParams.from;
  const to = resolvedParams.to;
  const sort = resolvedParams.sort || "asc";

  const client = await getServerApiClient();

  const { data, error } = await client.GET("/v1/events", {
    params: {
      query: {
        page,
        pageSize,
        ...(search ? { search } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        sort,
      },
    },
  });

  const events = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Curated Gatherings</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Explore Events
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Find and RSVP to premier tech summits, developer hackathons, and design workshops.
          </p>
        </div>

        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{events.length}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span> published events
        </div>
      </div>

      {/* Filter and Search Bar */}
      <EventFilters />

      {/* Error state if API call failed */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <XCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Failed to load events</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We encountered a problem connecting to the EventPass API. Please ensure the backend server is running and try again.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/events">Reload Events</Link>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!error && events.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-4 my-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarSearch className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">No events found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No published events match your current search criteria or date filters.
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/events">Reset All Filters</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!error && events.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination currentPage={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

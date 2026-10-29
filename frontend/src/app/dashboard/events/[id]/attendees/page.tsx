import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Clock,
  MapPin,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { getServerApiClient } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendeeRoster } from "@/components/dashboard/attendee-roster";
import { formatDateRange } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Attendee Roster & Live Check-In",
  description: "Monitor live check-in rates and export attendee rosters.",
};

interface AttendeesPageProps {
  params: Promise<{ id: string }>;
}

export default async function AttendeesPage({ params }: AttendeesPageProps) {
  const { id } = await params;
  const [session, client] = await Promise.all([
    getSession(),
    getServerApiClient(),
  ]);

  if (!session.user || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
    redirect("/events?error=unauthorized_organizer");
  }

  // Fetch attendees list and organizer events
  const [attendeesRes, eventsRes] = await Promise.all([
    client.GET("/v1/events/{id}/attendees", {
      params: { path: { id } },
    }),
    client.GET("/v1/events", {
      params: {
        query: {
          organizerId: session.user.id,
          pageSize: 100,
        },
      },
    }),
  ]);

  if (attendeesRes.error) {
    notFound();
  }

  const attendees = attendeesRes.data ?? [];
  const event = eventsRes.data?.items?.find((e) => e.id === id);

  // Compute live check-in analytics
  const totalTickets = attendees.length;
  const checkedInCount = attendees.filter((a) => a.status === "CHECKED_IN").length;
  const validCount = attendees.filter((a) => a.status === "VALID").length;
  const capacity = event?.capacity || totalTickets;
  const attendanceRate = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 max-w-7xl">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to My Events
        </Link>
      </div>

      {/* Header with Event Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Live Check-In Management</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {event?.title || "Attendee Roster"}
          </h1>
          {event && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Clock className="mr-1 h-3.5 w-3.5 text-primary" />
                {formatDateRange(event.startsAt, event.endsAt)}
              </span>
              <span className="flex items-center">
                <MapPin className="mr-1 h-3.5 w-3.5 text-primary" />
                {event.location}
              </span>
              <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
                {event.status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total RSVPs
            </CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalTickets} / {capacity}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed passes issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Checked In
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Attendees admitted at gate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Pending Entry
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{validCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Valid tickets not yet scanned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Turnout Rate
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Percentage of RSVPs checked in</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendee Roster Table & Search with CSV Download */}
      <AttendeeRoster
        attendees={attendees}
        eventSlug={event?.slug || "event"}
      />
    </div>
  );
}

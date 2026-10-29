import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { getServerApiClient } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventRowActions } from "@/components/dashboard/event-row-actions";
import { formatDateRange } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Organizer Hub & Event Management",
  description: "Manage your hosted events, monitor capacity in real-time, and check in attendees.",
};

export default async function DashboardPage() {
  const [session, client] = await Promise.all([
    getSession(),
    getServerApiClient(),
  ]);

  if (!session.user || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
    redirect("/events?error=unauthorized_organizer");
  }

  const { data } = await client.GET("/v1/events", {
    params: {
      query: {
        organizerId: session.user.id,
        pageSize: 50,
        sort: "desc",
      },
    },
  });

  const myEvents = data?.items ?? [];

  // Compute metrics
  const totalEvents = myEvents.length;
  const publishedEvents = myEvents.filter((e) => e.status === "PUBLISHED").length;
  const totalTicketsIssued = myEvents.reduce((acc, e) => acc + (e.ticketsCount ?? 0), 0);
  const totalCapacity = myEvents.reduce((acc, e) => acc + e.capacity, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Organizer Command Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            My Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your schedule, track live attendance, and inspect attendee rosters.
          </p>
        </div>

        <Button asChild className="shadow-md" size="lg">
          <Link href="/dashboard/events/new">
            <Plus className="mr-1.5 h-5 w-5" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Hosted on EventPass</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Live Published
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{publishedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active for public RSVP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Tickets Booked
            </CardTitle>
            <Ticket className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTicketsIssued}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed attendees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Capacity
            </CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative venue spots</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table / Card Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Hosted Events List
        </h2>

        {myEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-lg font-semibold text-foreground">No events created yet</h3>
              <p className="text-xs text-muted-foreground">
                Get started by publishing your first conference, workshop, or tech meetup.
              </p>
            </div>
            <div>
              <Button asChild>
                <Link href="/dashboard/events/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Host Your First Event
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Event Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date & Location</th>
                    <th className="p-4">Capacity & RSVPs</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myEvents.map((event) => {
                    const ticketsCount = event.ticketsCount ?? 0;
                    const percent = Math.min(100, Math.round((ticketsCount / (event.capacity || 1)) * 100));

                    return (
                      <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                        {/* Event Title & Slug */}
                        <td className="p-4">
                          <div className="font-bold text-sm text-foreground hover:text-primary">
                            <Link href={`/dashboard/events/${event.id}/attendees`}>
                              {event.title}
                            </Link>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            /{event.slug}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 whitespace-nowrap">
                          {event.status === "PUBLISHED" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                              PUBLISHED
                            </Badge>
                          ) : event.status === "CANCELLED" ? (
                            <Badge variant="destructive">CANCELLED</Badge>
                          ) : (
                            <Badge variant="secondary">DRAFT</Badge>
                          )}
                        </td>

                        {/* Date & Location */}
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{event.location}</span>
                          </div>
                        </td>

                        {/* Capacity Bar */}
                        <td className="p-4 whitespace-nowrap min-w-[160px]">
                          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span className="font-semibold text-foreground">
                              {ticketsCount} / {event.capacity}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-amber-500" : "bg-primary"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end">
                            <EventRowActions event={event} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

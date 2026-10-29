import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerApiClient } from "@/lib/api/server-client";
import { EventCard } from "@/components/events/event-card";
import type { components } from "@/lib/api/schema";

export default async function HomePage() {
  const client = await getServerApiClient();
  let featuredEvents: components["schemas"]["EventResponseDto"][] = [];

  try {
    const { data } = await client.GET("/v1/events", {
      params: {
        query: {
          pageSize: 3,
          sort: "asc",
        },
      },
    });
    featuredEvents = data?.items ?? [];
  } catch {
    featuredEvents = [];
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-muted/40 via-background to-background border-b">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Next-Generation Event Ticketing & RSVP</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl leading-tight">
            Discover Unforgettable Events. <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              RSVP in Seconds.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
            EventPass connects attendees with leading tech conferences, workshops, and exclusive
            gatherings. Backed by PostgreSQL row-locking to ensure zero overbooking.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button size="lg" asChild className="shadow-md">
              <Link href="/events">
                Explore Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Become an Organizer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <section className="py-16 bg-muted/20 border-b">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Happening Soon</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Featured Events
                </h2>
              </div>
              <Button variant="ghost" asChild className="text-primary hover:text-primary">
                <Link href="/events" className="flex items-center">
                  View all events
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature Highlights Grid */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Engineered for Reliability & Speed
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Built from the ground up to solve the hardest parts of event ticketing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>Zero Overselling Guarantee</CardTitle>
              <CardDescription>
                Concurrency-safe RSVP transactions execute with PostgreSQL row-level locks
                (<code className="text-xs">SELECT ... FOR UPDATE</code>) so events never exceed capacity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                Verified with 10 concurrent requests for 1 spot
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <QrCode className="h-5 w-5" />
              </div>
              <CardTitle>Atomic QR Check-In</CardTitle>
              <CardDescription>
                Attendees receive 160-bit cryptographically random QR codes. Organizers scan once with
                instant atomic status updates and double-scan prevention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                Distinct 409 error on repeated scans
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle>Organizer Command Hub</CardTitle>
              <CardDescription>
                Full event lifecycle controls: draft, schedule, publish, track capacity in real time,
                and export attendee rosters directly to CSV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                Direct CSV export and check-in metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

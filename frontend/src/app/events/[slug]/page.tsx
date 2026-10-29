import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { getServerApiClient } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventRsvpButton } from "@/components/events/event-rsvp-button";
import { formatDateBadge, formatDateRange, isEventPast } from "@/lib/utils/date";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = await getServerApiClient();
  const { data: event } = await client.GET("/v1/events/{slug}", {
    params: { path: { slug } },
  });

  if (!event) {
    return {
      title: "Event Not Found | EventPass",
    };
  }

  const title = `${event.title} | EventPass`;
  const description = event.description.slice(0, 160);
  const ogImages = typeof event.coverImageUrl === "string" ? [event.coverImageUrl] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const [session, client] = await Promise.all([
    getSession(),
    getServerApiClient(),
  ]);

  const { data: event, error } = await client.GET("/v1/events/{slug}", {
    params: { path: { slug } },
  });

  if (error || !event) {
    notFound();
  }

  // Check if current user already has a valid or checked-in ticket for this event
  let hasTicket = false;
  if (session.user) {
    const { data: myTickets } = await client.GET("/v1/tickets/me");
    if (myTickets && Array.isArray(myTickets)) {
      hasTicket = myTickets.some(
        (t) => t.eventId === event.id && (t.status === "VALID" || t.status === "CHECKED_IN"),
      );
    }
  }

  const { month, day } = formatDateBadge(event.startsAt);
  const ticketsCount = event.ticketsCount ?? 0;
  const spotsLeft = Math.max(0, event.capacity - ticketsCount);
  const isPast = isEventPast(event.endsAt);
  const isOrganizer = Boolean(
    session.user && (session.user.id === event.organizerId || session.user.role === "ADMIN"),
  );
  const capacityPercent = Math.min(
    100,
    Math.round((ticketsCount / (event.capacity || 1)) * 100),
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to all events
        </Link>
      </div>

      {/* Hero Banner / Cover Section */}
      <div className="relative aspect-[21/9] min-h-[260px] w-full overflow-hidden rounded-2xl border bg-gradient-to-tr from-slate-900 via-primary/70 to-blue-700 shadow-md">
        {event.coverImageUrl && typeof event.coverImageUrl === "string" ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="text-6xl font-black text-white/50 tracking-wider">EVENTPASS</span>
          </div>
        )}

        {/* Date Overlay Badge */}
        <div className="absolute top-4 left-4 flex flex-col items-center justify-center rounded-xl bg-background/95 px-3 py-1.5 text-center shadow-lg backdrop-blur">
          <span className="text-xs font-bold tracking-wider text-primary uppercase">{month}</span>
          <span className="text-2xl font-black text-foreground leading-none">{day}</span>
        </div>

        {/* Status Overlay Badge */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isPast ? (
            <Badge variant="secondary" className="shadow-md bg-background/90 backdrop-blur text-sm">
              Past Event
            </Badge>
          ) : spotsLeft === 0 ? (
            <Badge variant="destructive" className="shadow-md text-sm">
              Sold Out
            </Badge>
          ) : (
            <Badge variant="secondary" className="shadow-md bg-background/90 backdrop-blur text-sm">
              {spotsLeft} Spots Remaining
            </Badge>
          )}
        </div>
      </div>

      {/* Main Grid: Details (Left) & Ticket Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Title, Host, Date, Venue, Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {event.title}
            </h1>

            {/* Host info badge */}
            <div className="flex items-center space-x-3 pt-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Organized by</p>
                <p className="text-sm font-semibold text-foreground">
                  {event.organizer?.name || "EventPass Verified Organizer"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex items-start space-x-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Date & Time</h4>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {formatDateRange(event.startsAt, event.endsAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start space-x-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Location / Venue</h4>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {event.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About Event Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground border-b pb-2">
              About this Event
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        </div>

        {/* Right Column: RSVP Ticket Box (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-lg space-y-6">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary">
                Admission
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-2xl font-black text-foreground">Free RSVP</h3>
                <Badge variant={spotsLeft > 0 ? "secondary" : "destructive"}>
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
                </Badge>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Users className="mr-1 h-3.5 w-3.5 text-primary" />
                  Reserved Spots
                </span>
                <span className="font-semibold text-foreground">
                  {ticketsCount} / {event.capacity}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    spotsLeft === 0
                      ? "bg-destructive"
                      : spotsLeft <= 10
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>

            {/* Interactive RSVP Button Component */}
            <EventRsvpButton
              eventId={event.id}
              eventSlug={event.slug}
              eventCapacity={event.capacity}
              ticketsCount={ticketsCount}
              isPast={isPast}
              isOrganizer={isOrganizer}
              hasTicket={hasTicket}
              isAuthenticated={Boolean(session.user)}
            />

            {/* Event Guarantees */}
            <div className="space-y-2.5 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Zero oversell guarantee with row locks</span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCode className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Instant QR code ticket in your wallet</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>Cancel ticket anytime before event starts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

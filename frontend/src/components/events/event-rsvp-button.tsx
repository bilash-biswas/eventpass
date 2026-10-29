"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LayoutDashboard, Loader2, LogIn, QrCode, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rsvpAction } from "@/lib/actions/rsvp";

interface EventRsvpButtonProps {
  eventId: string;
  eventSlug: string;
  eventCapacity: number;
  ticketsCount: number;
  isPast: boolean;
  isOrganizer: boolean;
  hasTicket: boolean;
  isAuthenticated: boolean;
}

export function EventRsvpButton({
  eventId,
  eventSlug,
  eventCapacity,
  ticketsCount,
  isPast,
  isOrganizer,
  hasTicket: initialHasTicket,
  isAuthenticated,
}: EventRsvpButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [hasTicket, setHasTicket] = React.useState(initialHasTicket);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const spotsLeft = Math.max(0, eventCapacity - ticketsCount);
  const isSoldOut = spotsLeft === 0;

  // 1. Not Authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Button size="lg" className="w-full text-base font-semibold shadow-md" asChild>
          <Link href={`/login?from=/events/${eventSlug}`}>
            <LogIn className="mr-2 h-5 w-5" />
            Sign In to RSVP
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary underline hover:opacity-80">
            Create one free
          </Link>
        </p>
      </div>
    );
  }

  // 2. User is the organizer of this event
  if (isOrganizer) {
    return (
      <div className="space-y-3">
        <Button size="lg" variant="outline" className="w-full text-base font-semibold border-primary/40" asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
            Organizer Dashboard
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You are the host of this event. Manage attendees and capacity from your hub.
        </p>
      </div>
    );
  }

  // 3. User already holds an active ticket for this event
  if (hasTicket) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">You&apos;re Confirmed!</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your admission ticket and entry QR code are ready.
          </p>
        </div>
        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
          <Link href="/my-tickets">
            <QrCode className="mr-1.5 h-4 w-4" />
            View My Ticket & QR
          </Link>
        </Button>
      </div>
    );
  }

  // 4. Past event
  if (isPast) {
    return (
      <Button size="lg" disabled className="w-full text-base opacity-60 cursor-not-allowed">
        Event Has Ended
      </Button>
    );
  }

  // 5. Sold out
  if (isSoldOut) {
    return (
      <div className="space-y-2">
        <Button size="lg" disabled variant="destructive" className="w-full text-base cursor-not-allowed">
          Sold Out
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          All {eventCapacity} spots have been claimed. Check back later for cancellations.
        </p>
      </div>
    );
  }

  // 6. Action handler
  const handleRsvp = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await rsvpAction(eventId, eventSlug);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to confirm RSVP. Please try again.");
      } else {
        setHasTicket(true);
        setSuccessMessage("Your RSVP is confirmed! Admission ticket issued.");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="flex items-start space-x-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start space-x-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleRsvp}
        disabled={isPending}
        className="w-full text-base font-semibold shadow-md bg-primary hover:bg-primary/90"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Securing Spot...
          </>
        ) : (
          <>
            <Ticket className="mr-2 h-5 w-5" />
            RSVP for Free
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Guaranteed zero overbooking via PostgreSQL row-level locks.
      </p>
    </div>
  );
}

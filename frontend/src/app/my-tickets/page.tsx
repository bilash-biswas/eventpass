import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, QrCode, Sparkles, Ticket as TicketIcon } from "lucide-react";
import { getServerApiClient } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { TicketTabs } from "@/components/tickets/ticket-tabs";

export const metadata: Metadata = {
  title: "My Tickets & Entry Passes",
  description: "View your active event admission tickets, QR codes, and past attendance records.",
};

export default async function MyTicketsPage() {
  const [session, client] = await Promise.all([
    getSession(),
    getServerApiClient(),
  ]);

  if (!session.user) {
    redirect("/login?from=/my-tickets");
  }

  const { data: tickets, error } = await client.GET("/v1/tickets/me");

  const ticketList = tickets ?? [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital Admission Wallet</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            My Tickets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <strong className="text-foreground">{session.user.name}</strong> ({session.user.email})
          </p>
        </div>

        <Button asChild size="sm" className="shadow-sm">
          <Link href="/events">
            Find More Events
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to fetch your tickets. Please refresh the page or try signing in again.
        </div>
      )}

      {/* Zero Tickets Empty State */}
      {!error && ticketList.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-5 my-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <QrCode className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-foreground">Your Wallet is Empty</h3>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t RSVP&apos;d to any events yet. Explore premier conferences and workshops to claim your first pass.
            </p>
          </div>
          <div>
            <Button size="lg" asChild className="shadow-md">
              <Link href="/events">
                <TicketIcon className="mr-2 h-4 w-4" />
                Browse Published Events
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tickets List with Active/History Tabs */}
      {!error && ticketList.length > 0 && (
        <TicketTabs tickets={ticketList} />
      )}
    </div>
  );
}

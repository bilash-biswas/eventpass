import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerApiClient } from "@/lib/api/server-client";
import { EventForm } from "@/components/dashboard/event-form";

export const metadata: Metadata = {
  title: "Edit Event",
  description: "Update event schedule, venue location, capacity, or publishing status.",
};

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const [session, client] = await Promise.all([
    getSession(),
    getServerApiClient(),
  ]);

  if (!session.user || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
    redirect("/events?error=unauthorized_organizer");
  }

  // Fetch organizer's events to find this event
  const { data } = await client.GET("/v1/events", {
    params: {
      query: {
        organizerId: session.user.id,
        pageSize: 100,
      },
    },
  });

  const event = data?.items?.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-6xl">
      <EventForm initialData={event} eventId={id} />
    </div>
  );
}

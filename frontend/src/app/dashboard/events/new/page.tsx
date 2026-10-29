import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EventForm } from "@/components/dashboard/event-form";

export const metadata: Metadata = {
  title: "Create New Event",
  description: "Draft and publish a new event with guaranteed capacity row-level locking.",
};

export default async function NewEventPage() {
  const session = await getSession();

  if (!session.user || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
    redirect("/events?error=unauthorized_organizer");
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-6xl">
      <EventForm />
    </div>
  );
}

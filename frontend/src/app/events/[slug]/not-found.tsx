import Link from "next/link";
import { CalendarX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <CalendarX className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">Event Not Found</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        The event you are looking for does not exist, has been removed, or has not been published yet.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Published Events
          </Link>
        </Button>
      </div>
    </div>
  );
}

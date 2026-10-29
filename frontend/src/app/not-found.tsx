import Link from "next/link";
import { ArrowLeft, Compass, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-sm">
        <Compass className="h-10 w-10 animate-pulse" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          404 — Page Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Lost in the Event Pass?
        </h1>
        <p className="text-sm text-muted-foreground">
          The page or route you requested could not be located. It may have been moved, renamed, or
          is temporarily unavailable.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="shadow-md">
          <Link href="/events">
            <Ticket className="mr-2 h-4 w-4" />
            Explore All Events
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

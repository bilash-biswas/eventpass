"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log unexpected client error
    console.error("Unhandled client error in EventPass application:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-6 shadow-sm">
        <AlertTriangle className="h-10 w-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-bold uppercase tracking-widest text-destructive">
          Application Error
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page. Our technical team has been
          notified.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted py-1 px-2 rounded inline-block mt-2">
            Digest: {error.digest}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={() => reset()} className="shadow-md">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Fatal root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Critical System Error</h1>
          <p className="text-sm text-slate-600">
            A fatal error prevented the application layout from rendering. Please reload the
            application to restore session state.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400 bg-slate-100 p-2 rounded">
              Error Digest: {error.digest}
            </p>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow"
            >
              Restart Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

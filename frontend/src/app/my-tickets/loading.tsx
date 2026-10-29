import { Skeleton } from "@/components/ui/skeleton";

export default function MyTicketsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-5xl space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-3 border-b pb-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Ticket List Skeletons */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <div className="w-full md:w-64 flex flex-col items-center justify-center space-y-3 p-4 bg-muted/20 rounded-xl">
              <Skeleton className="h-36 w-36 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

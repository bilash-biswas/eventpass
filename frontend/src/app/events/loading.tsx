import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Filter Box Skeleton */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Grid of Event Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden space-y-4 p-0">
            <Skeleton className="aspect-video w-full" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="pt-4 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

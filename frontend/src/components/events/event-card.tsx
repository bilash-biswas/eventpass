import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateBadge, formatDateTime, isEventPast } from "@/lib/utils/date";
import type { components } from "@/lib/api/schema";

type EventItem = components["schemas"]["EventResponseDto"];

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const { month, day } = formatDateBadge(event.startsAt);
  const ticketsCount = event.ticketsCount ?? 0;
  const spotsLeft = Math.max(0, event.capacity - ticketsCount);
  const isSoldOut = spotsLeft === 0;
  const isPast = isEventPast(event.endsAt);

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full focus:outline-none">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:border-primary/40 group-focus:ring-2 group-focus:ring-primary flex flex-col">
        {/* Cover image or fallback banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-tr from-slate-800 via-primary/80 to-blue-600">
          {event.coverImageUrl && typeof event.coverImageUrl === "string" ? (
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <span className="text-4xl font-black text-white/50 tracking-wider">EVENT</span>
            </div>
          )}

          {/* Date Badge Overlay */}
          <div className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-lg bg-background/95 px-2.5 py-1 text-center shadow-md backdrop-blur">
            <span className="text-[10px] font-bold tracking-wider text-primary uppercase">{month}</span>
            <span className="text-base font-extrabold text-foreground leading-none">{day}</span>
          </div>

          {/* Capacity / Status Overlay Badge */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {isPast ? (
              <Badge variant="secondary" className="shadow bg-background/90 backdrop-blur text-xs">
                Past Event
              </Badge>
            ) : isSoldOut ? (
              <Badge variant="destructive" className="shadow text-xs">
                Sold Out
              </Badge>
            ) : spotsLeft <= 10 ? (
              <Badge variant="warning" className="shadow text-xs font-semibold">
                Only {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
              </Badge>
            ) : (
              <Badge variant="secondary" className="shadow bg-background/90 backdrop-blur text-xs">
                {spotsLeft} spots available
              </Badge>
            )}
          </div>
        </div>

        {/* Card Content */}
        <CardContent className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {event.title}
          </h3>

          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="truncate">{formatDateTime(event.startsAt)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                Hosted by {event.organizer?.name || "EventPass Organizer"}
              </span>
            </div>
          </div>

          {/* Footer capacity bar */}
          <div className="mt-auto pt-4">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Capacity</span>
              <span>{ticketsCount} / {event.capacity} booked</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSoldOut
                    ? "bg-destructive"
                    : spotsLeft <= 10
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((ticketsCount / (event.capacity || 1)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

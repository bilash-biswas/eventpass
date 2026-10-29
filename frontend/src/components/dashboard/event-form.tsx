"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { eventFormSchema, type EventFormData } from "@/lib/validations/event.schema";
import { createEventAction, updateEventAction } from "@/lib/actions/events";
import type { components } from "@/lib/api/schema";

type EventItem = components["schemas"]["EventResponseDto"];

interface EventFormProps {
  initialData?: EventItem;
  eventId?: string;
}

export function EventForm({ initialData, eventId }: EventFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Helper to format ISO date to datetime-local string (YYYY-MM-DDTHH:mm)
  const formatForInput = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return "";
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      startsAt: formatForInput(initialData?.startsAt),
      endsAt: formatForInput(initialData?.endsAt),
      capacity: initialData?.capacity || 100,
      coverImageUrl: (typeof initialData?.coverImageUrl === "string" ? initialData.coverImageUrl : "") || "",
      status: (initialData?.status as "DRAFT" | "PUBLISHED" | "CANCELLED") || "DRAFT",
    },
  });

  // Watch values for real-time live preview
  const liveTitle = watch("title") || "Untitled Event";
  const liveLocation = watch("location") || "Venue Location TBD";
  const liveStartsAt = watch("startsAt");
  const liveCapacity = watch("capacity") || 100;
  const liveCover = watch("coverImageUrl");
  const liveStatus = watch("status");

  const onSubmit = async (data: EventFormData) => {
    setServerError(null);

    if (eventId) {
      const result = await updateEventAction(eventId, data);
      if (!result.success) {
        setServerError(result.error || "Failed to update event.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const result = await createEventAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to create event.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {serverError && (
        <div className="flex items-center space-x-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{eventId ? "Edit Event" : "Create New Event"}</CardTitle>
              <CardDescription>
                Configure event dates, venue location, capacity caps, and publishing status.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Event Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Next.js World Summit 2026"
                  {...register("title")}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Location / Venue <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Moscone Convention Center, San Francisco, CA"
                  {...register("location")}
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location.message}</p>
                )}
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Starts At <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    {...register("startsAt")}
                    aria-invalid={Boolean(errors.startsAt)}
                  />
                  {errors.startsAt && (
                    <p className="text-xs text-destructive">{errors.startsAt.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Ends At <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    {...register("endsAt")}
                    aria-invalid={Boolean(errors.endsAt)}
                  />
                  {errors.endsAt && (
                    <p className="text-xs text-destructive">{errors.endsAt.message}</p>
                  )}
                </div>
              </div>

              {/* Capacity and Initial Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Max Capacity (Headcount) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    placeholder="250"
                    {...register("capacity", { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.capacity)}
                  />
                  {errors.capacity && (
                    <p className="text-xs text-destructive">{errors.capacity.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Publication Status <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register("status")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="DRAFT">DRAFT (Hidden from public catalog)</option>
                    <option value="PUBLISHED">PUBLISHED (Live for public RSVPs)</option>
                    {eventId && <option value="CANCELLED">CANCELLED</option>}
                  </select>
                  {errors.status && (
                    <p className="text-xs text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Cover Image URL (Optional)
                </label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  {...register("coverImageUrl")}
                  aria-invalid={Boolean(errors.coverImageUrl)}
                />
                <p className="text-[11px] text-muted-foreground">
                  A high-resolution landscape banner image. Leave blank to use our default gradient.
                </p>
                {errors.coverImageUrl && (
                  <p className="text-xs text-destructive">{errors.coverImageUrl.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Full Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Provide an overview of the event, scheduled speakers, itinerary, and venue details..."
                  {...register("description")}
                  aria-invalid={Boolean(errors.description)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="shadow-md">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Event...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {eventId ? "Save Changes" : "Create Event"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Live Card Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Eye className="h-4 w-4 text-primary" />
              <span>Catalog Card Preview</span>
            </div>

            {/* Simulated Event Card */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="relative aspect-video w-full bg-gradient-to-tr from-slate-800 via-primary/80 to-blue-600 overflow-hidden">
                {liveCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={liveCover}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <ImageIcon className="h-10 w-10 text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={liveStatus === "PUBLISHED" ? "default" : "secondary"}>
                    {liveStatus}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-bold text-base text-foreground line-clamp-2">{liveTitle}</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>{liveStartsAt ? new Date(liveStartsAt).toLocaleString() : "Date TBD"}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{liveLocation}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Capacity: {liveCapacity} attendees</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Preview updates live as you type. Slugs are automatically computed and deduplicated deterministically by the backend.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

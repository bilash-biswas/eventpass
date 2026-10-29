"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePublishAction, softCancelEventAction } from "@/lib/actions/events";
import type { components } from "@/lib/api/schema";

type EventItem = components["schemas"]["EventResponseDto"];

interface EventRowActionsProps {
  event: EventItem;
}

export function EventRowActions({ event }: EventRowActionsProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleTogglePublish = async () => {
    setIsToggling(true);
    setErrorMessage(null);
    const newStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await togglePublishAction(event.id, newStatus);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to update publication status.");
    }
    setIsToggling(false);
    router.refresh();
  };

  const handleSoftCancel = async () => {
    setIsCancelling(true);
    setErrorMessage(null);
    const res = await softCancelEventAction(event.id);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to cancel event.");
      setIsCancelling(false);
    } else {
      setShowCancelModal(false);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
        {/* Attendees & Check-in Roster */}
        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
          <Link href={`/dashboard/events/${event.id}/attendees`}>
            <Users className="h-3.5 w-3.5 mr-1 text-primary" />
            Attendees
          </Link>
        </Button>

        {/* Edit Event */}
        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
          <Link href={`/dashboard/events/${event.id}/edit`}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Link>
        </Button>

        {/* View Public Page */}
        {event.status === "PUBLISHED" && (
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
            <Link href={`/events/${event.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Public
            </Link>
          </Button>
        )}

        {/* Publish / Unpublish Toggle */}
        {event.status !== "CANCELLED" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePublish}
            disabled={isToggling}
            className="h-8 text-xs"
          >
            {event.status === "PUBLISHED" ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
                Publish
              </>
            )}
          </Button>
        )}

        {/* Soft Cancel Button */}
        {event.status !== "CANCELLED" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="text-[11px] text-destructive mt-1">{errorMessage}</div>
      )}

      {/* Confirmation Modal for Event Cancellation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-destructive">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Cancel Event?</h4>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel <strong className="text-foreground">{event.title}</strong>?
              This will set the event status to <strong>CANCELLED</strong> and close all future RSVPs.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Event
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSoftCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

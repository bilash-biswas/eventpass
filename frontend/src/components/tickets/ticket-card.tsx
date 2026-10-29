"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckCheck,
  Copy,
  ExternalLink,
  MapPin,
  Printer,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatDateTime, isEventPast } from "@/lib/utils/date";
import { cancelRsvpAction } from "@/lib/actions/rsvp";
import type { components } from "@/lib/api/schema";

type Ticket = components["schemas"]["TicketResponseDto"];

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const event = ticket.event;
  const isPast = event ? isEventPast(event.endsAt) : false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!event) return;
    setIsCancelling(true);
    setCancelError(null);

    const result = await cancelRsvpAction(ticket.eventId, event.slug);
    if (!result.success) {
      setCancelError(result.error || "Failed to cancel RSVP.");
      setIsCancelling(false);
    } else {
      setShowCancelModal(false);
      router.refresh();
    }
  };

  // Status Badge Rendering
  const renderStatusBadge = () => {
    if (ticket.status === "CHECKED_IN") {
      return (
        <Badge className="bg-sky-600 hover:bg-sky-600 text-white space-x-1">
          <CheckCheck className="h-3.5 w-3.5" />
          <span>Checked In</span>
        </Badge>
      );
    }
    if (ticket.status === "CANCELLED") {
      return (
        <Badge variant="destructive" className="space-x-1">
          <XCircle className="h-3.5 w-3.5" />
          <span>Cancelled</span>
        </Badge>
      );
    }
    if (isPast) {
      return (
        <Badge variant="secondary" className="space-x-1">
          <span>Event Concluded</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white space-x-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Valid for Entry</span>
      </Badge>
    );
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md flex flex-col md:flex-row">
        {/* Left / Main Section: Event Details & Metadata */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header: Status and Ticket Number */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                {renderStatusBadge()}
                <span className="text-xs text-muted-foreground">
                  Issued on {formatDateTime(ticket.createdAt)}
                </span>
              </div>

              {event && (
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  <span>Event Page</span>
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {/* Event Title */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {event?.title || "Event Admission Ticket"}
              </h3>
            </div>

            {/* Event Time & Venue Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2.5">
                <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-semibold uppercase text-foreground">
                    Date & Time
                  </span>
                  <span>
                    {event ? formatDateRange(event.startsAt, event.endsAt) : "Date unannounced"}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-semibold uppercase text-foreground">
                    Venue Location
                  </span>
                  <span>{event?.location || "Venue details inside"}</span>
                </div>
              </div>
            </div>

            {/* Attendee Holder Details */}
            {ticket.user && (
              <div className="flex items-center space-x-2 pt-2 text-xs text-muted-foreground border-t">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ticket Holder:</span>
                <span className="font-semibold text-foreground">{ticket.user.name}</span>
                <span className="text-muted-foreground">({ticket.user.email})</span>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t flex items-center justify-between flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-8 text-muted-foreground"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print / Save PDF
            </Button>

            {ticket.status === "VALID" && !isPast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Cancel Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Ticket Perforation Notch (Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-between my-4 relative">
          <div className="h-4 w-4 rounded-full bg-background border -mt-6" />
          <div className="w-[1px] h-full border-r-2 border-dashed border-muted-foreground/30 my-2" />
          <div className="h-4 w-4 rounded-full bg-background border -mb-6" />
        </div>

        {/* Ticket Perforation Notch (Mobile) */}
        <div className="flex md:hidden items-center justify-between mx-4 relative">
          <div className="h-4 w-4 rounded-full bg-background border -ml-6" />
          <div className="h-[1px] w-full border-b-2 border-dashed border-muted-foreground/30 mx-2" />
          <div className="h-4 w-4 rounded-full bg-background border -mr-6" />
        </div>

        {/* Right / Tear-Off Stub: QR Code & Code Value */}
        <div className="w-full md:w-64 p-6 bg-muted/20 flex flex-col items-center justify-center text-center space-y-3">
          {/* QR Container */}
          <div className="p-3 bg-white rounded-xl shadow-sm border">
            <QRCodeSVG
              value={ticket.code}
              size={144}
              level="H"
              includeMargin={false}
              className="w-36 h-36"
            />
          </div>

          {/* Cryptographic Code & Copy Action */}
          <div className="space-y-1 w-full">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Entry Pass Code
            </div>
            <div className="flex items-center justify-center space-x-1 font-mono text-xs font-bold text-foreground bg-background py-1 px-2 rounded border">
              <span className="truncate max-w-[150px]">{ticket.code}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy code"
                className="hover:text-primary transition-colors p-0.5"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-tight">
            Atomic verification scan at gate prevents duplicates.
          </p>
        </div>
      </div>

      {/* Cancel RSVP Confirmation Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-destructive">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Cancel your RSVP?</h4>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel your ticket for{" "}
              <strong className="text-foreground">{event?.title}</strong>? Your spot will immediately
              be released to other waiting attendees.
            </p>

            {cancelError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Ticket
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Release My Spot"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

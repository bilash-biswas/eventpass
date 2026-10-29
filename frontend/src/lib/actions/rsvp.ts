"use server";

import { revalidatePath } from "next/cache";
import { getServerApiClient } from "@/lib/api/server-client";

export async function rsvpAction(eventId: string, slug?: string) {
  try {
    const client = await getServerApiClient();

    const res = await client.POST("/v1/events/{id}/rsvp", {
      params: {
        path: { id: eventId },
      },
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string; statusCode?: number };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to confirm RSVP. Please try again.",
      };
    }

    if (slug) {
      revalidatePath(`/events/${slug}`);
    }
    revalidatePath("/events");
    revalidatePath("/my-tickets");

    return {
      success: true,
      ticket: res.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error during RSVP.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function cancelRsvpAction(eventId: string, slug?: string) {
  try {
    const client = await getServerApiClient();

    const res = await client.DELETE("/v1/events/{id}/rsvp", {
      params: {
        path: { id: eventId },
      },
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string; statusCode?: number };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to cancel ticket. Please try again.",
      };
    }

    if (slug) {
      revalidatePath(`/events/${slug}`);
    }
    revalidatePath("/events");
    revalidatePath("/my-tickets");

    return {
      success: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error during cancellation.";
    return {
      success: false,
      error: message,
    };
  }
}

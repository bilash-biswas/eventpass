"use server";

import { revalidatePath } from "next/cache";
import { getServerApiClient } from "@/lib/api/server-client";
import type { EventFormData } from "@/lib/validations/event.schema";

export async function createEventAction(formData: EventFormData) {
  try {
    const client = await getServerApiClient();

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      startsAt: new Date(formData.startsAt).toISOString(),
      endsAt: new Date(formData.endsAt).toISOString(),
      capacity: formData.capacity,
      coverImageUrl: formData.coverImageUrl ? formData.coverImageUrl : undefined,
      status: formData.status,
    };

    const res = await client.POST("/v1/events", {
      body: payload,
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to create event.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/events");

    return {
      success: true,
      event: res.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error creating event.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function updateEventAction(id: string, formData: Partial<EventFormData>) {
  try {
    const client = await getServerApiClient();

    const payload = {
      ...(formData.title ? { title: formData.title } : {}),
      ...(formData.description ? { description: formData.description } : {}),
      ...(formData.location ? { location: formData.location } : {}),
      ...(formData.startsAt ? { startsAt: new Date(formData.startsAt).toISOString() } : {}),
      ...(formData.endsAt ? { endsAt: new Date(formData.endsAt).toISOString() } : {}),
      ...(formData.capacity !== undefined ? { capacity: formData.capacity } : {}),
      ...(formData.coverImageUrl !== undefined
        ? { coverImageUrl: formData.coverImageUrl || undefined }
        : {}),
      ...(formData.status ? { status: formData.status } : {}),
    };

    const res = await client.PATCH("/v1/events/{id}", {
      params: { path: { id } },
      body: payload,
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to update event.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/events");
    if (res.data?.slug) {
      revalidatePath(`/events/${res.data.slug}`);
    }

    return {
      success: true,
      event: res.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error updating event.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function togglePublishAction(id: string, status: "DRAFT" | "PUBLISHED") {
  try {
    const client = await getServerApiClient();

    const res = await client.PATCH("/v1/events/{id}", {
      params: { path: { id } },
      body: { status },
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to change publication status.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/events");
    if (res.data?.slug) {
      revalidatePath(`/events/${res.data.slug}`);
    }

    return {
      success: true,
      event: res.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error toggling status.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function softCancelEventAction(id: string) {
  try {
    const client = await getServerApiClient();

    const res = await client.DELETE("/v1/events/{id}", {
      params: { path: { id } },
    });

    if (res.error) {
      const err = res.error as { message?: string | string[]; error?: string };
      const message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      return {
        success: false,
        error: message || err.error || "Failed to cancel event.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/events");
    if (res.data?.slug) {
      revalidatePath(`/events/${res.data.slug}`);
    }

    return {
      success: true,
      event: res.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error cancelling event.";
    return {
      success: false,
      error: message,
    };
  }
}

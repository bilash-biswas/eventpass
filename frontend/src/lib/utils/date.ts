/**
 * Utility functions for date formatting and presentation in EventPass.
 */

export function formatDateBadge(dateStr: string): { month: string; day: string } {
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = date.toLocaleDateString("en-US", { day: "numeric" });
    return { month, day };
  } catch {
    return { month: "EVT", day: "--" };
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateRange(startsAtStr: string, endsAtStr: string): string {
  try {
    const start = new Date(startsAtStr);
    const end = new Date(endsAtStr);

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      const datePart = start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const startTime = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const endTime = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
      return `${datePart} • ${startTime} – ${endTime}`;
    }

    return `${formatDateTime(startsAtStr)} – ${formatDateTime(endsAtStr)}`;
  } catch {
    return `${startsAtStr} – ${endsAtStr}`;
  }
}

export function isEventPast(endsAtStr: string): boolean {
  try {
    return new Date(endsAtStr).getTime() < Date.now();
  } catch {
    return false;
  }
}

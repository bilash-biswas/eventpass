import { type ClassValue, clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date, formatStr = "PPP"): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, "MMM d, yyyy · h:mm a");
}

export function formatEventDateRange(startsAt: string | Date, endsAt: string | Date): string {
  try {
    const start = typeof startsAt === "string" ? parseISO(startsAt) : startsAt;
    const end = typeof endsAt === "string" ? parseISO(endsAt) : endsAt;

    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
      return `${format(start, "EEEE, MMMM d, yyyy")} · ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
    }

    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${String(startsAt)} - ${String(endsAt)}`;
  }
}

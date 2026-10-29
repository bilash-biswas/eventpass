import { z } from "zod";

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters long" })
      .max(120, { message: "Title cannot exceed 120 characters" }),
    description: z
      .string()
      .min(20, { message: "Description must be at least 20 characters long" }),
    location: z
      .string()
      .min(3, { message: "Location / Venue is required (at least 3 characters)" }),
    startsAt: z
      .string()
      .min(1, { message: "Start date and time are required" }),
    endsAt: z
      .string()
      .min(1, { message: "End date and time are required" }),
    capacity: z
      .number({ message: "Capacity must be a number" })
      .int({ message: "Capacity must be an integer" })
      .min(1, { message: "Capacity must be at least 1" })
      .max(100000, { message: "Capacity cannot exceed 100,000" }),
    coverImageUrl: z
      .string()
      .url({ message: "Cover image must be a valid HTTPS or HTTP URL" })
      .optional()
      .or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      const start = new Date(data.startsAt);
      const end = new Date(data.endsAt);
      return end > start;
    },
    {
      message: "End time must be strictly after start time",
      path: ["endsAt"],
    },
  );

export type EventFormData = z.infer<typeof eventFormSchema>;

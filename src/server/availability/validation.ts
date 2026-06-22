import { z } from "zod";

import { isValidIanaTimeZone } from "@/server/availability/timezone";

const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:mm value");

export const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: localTime,
    endTime: localTime,
  })
  .refine(({ startTime, endTime }) => startTime < endTime, {
    message: "End time must be later than start time",
    path: ["endTime"],
  });

export const scheduleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  timeZone: z.string().refine(isValidIanaTimeZone, "Enter a valid IANA timezone"),
  rules: z.array(availabilityRuleSchema).max(50),
});

export const eventTypeSchema = z.object({
  title: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(2000).optional(),
  durationMinutes: z.number().int().min(5).max(720),
  slotIntervalMinutes: z.number().int().min(5).max(720).optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(720).default(0),
  bufferAfterMinutes: z.number().int().min(0).max(720).default(0),
  minimumNoticeMinutes: z.number().int().min(0).max(525_600).default(120),
  bookingWindowDays: z.number().int().min(1).max(730).default(60),
  scheduleId: z.string().cuid(),
});

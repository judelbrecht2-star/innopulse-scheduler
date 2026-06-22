import { z } from "zod";

import { isValidIanaTimeZone } from "@/server/availability/timezone";

export const bookingRequestSchema = z.object({
  eventTypeId: z.string().cuid(),
  start: z.string().datetime({ offset: true }),
  timeZone: z.string().refine(isValidIanaTimeZone, "Enter a valid IANA timezone"),
  inviteeName: z.string().trim().min(1).max(120),
  inviteeEmail: z.string().trim().email().max(254),
  inviteePhone: z.string().trim().max(40).optional(),
  idempotencyKey: z.string().uuid(),
  rescheduleUid: z.string().uuid().optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        value: z.union([z.string().max(5000), z.array(z.string().max(500)).max(30), z.boolean(), z.number()]),
      }),
    )
    .max(50)
    .default([]),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

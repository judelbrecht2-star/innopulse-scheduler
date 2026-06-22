import { z } from "zod";

import { isValidIanaTimeZone } from "@/server/availability/timezone";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const eventQuestionSchema = z.object({
  type: z.enum([
    "SHORT_TEXT",
    "LONG_TEXT",
    "EMAIL",
    "PHONE",
    "NUMBER",
    "SINGLE_SELECT",
    "MULTI_SELECT",
    "CHECKBOX",
  ]),
  label: z.string().trim().min(1).max(120),
  placeholder: z.string().trim().max(160).optional().default(""),
  helpText: z.string().trim().max(240).optional().default(""),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

export const eventTypeInputSchema = z.object({
  title: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().max(1000).optional().default(""),
  status: z.enum(["DRAFT", "ACTIVE"]),
  durationMinutes: z.number().int().min(5).max(480),
  slotIntervalMinutes: z.number().int().min(5).max(480),
  bufferBeforeMinutes: z.number().int().min(0).max(1440),
  bufferAfterMinutes: z.number().int().min(0).max(1440),
  minimumNoticeMinutes: z.number().int().min(0).max(10080),
  bookingWindowDays: z.number().int().min(1).max(365),
  maxBookingsPerDay: z.number().int().min(1).max(100).nullable(),
  requiresConfirmation: z.boolean(),
  confirmationEmailEnabled: z.boolean(),
  confirmationEmailSubject: z.string().trim().min(2).max(200),
  confirmationEmailMessage: z.string().trim().min(2).max(3000),
  meetingAgenda: z.string().trim().max(3000),
  homeworkCtaLabel: z.string().trim().max(100),
  homeworkCtaUrl: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid homework URL.").max(1000).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Use an http or https homework URL."),
  ]),
  locationType: z.enum(["GOOGLE_MEET", "MICROSOFT_TEAMS", "PHONE", "IN_PERSON", "CUSTOM"]),
  locationValue: z.string().trim().max(300).optional().default(""),
  questions: z.array(eventQuestionSchema).max(10),
  schedulingType: z.enum(["INDIVIDUAL", "ROUND_ROBIN", "COLLECTIVE"]).default("INDIVIDUAL"),
  hostIds: z.array(z.string().cuid()).min(1).max(50).default([]),
});

export const routingFormInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["DRAFT", "ACTIVE"]),
  questionLabel: z.string().trim().min(2).max(160),
  options: z.array(z.object({ label: z.string().trim().min(1).max(100), eventTypeId: z.string().cuid() })).min(2).max(20),
  fallbackEventTypeId: z.string().cuid().nullable(),
}).superRefine((value, context) => {
  const labels = value.options.map((option) => option.label.toLowerCase());
  if (new Set(labels).size !== labels.length) context.addIssue({ code: "custom", path: ["options"], message: "Routing answers must be unique." });
});

export const workflowInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  eventTypeId: z.string().cuid().nullable(),
  status: z.enum(["ACTIVE", "PAUSED"]),
  trigger: z.enum(["BOOKING_CREATED", "BEFORE_START", "AFTER_END", "BOOKING_CANCELED"]),
  offsetMinutes: z.number().int().min(0).max(43200),
  recipient: z.enum(["INVITEE", "HOST"]),
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(10000),
});

const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern),
    endTime: z.string().regex(timePattern),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

const availabilityOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    startTime: z.string().regex(timePattern).nullable(),
    endTime: z.string().regex(timePattern).nullable(),
    note: z.string().trim().max(160).optional().default(""),
  })
  .superRefine((value, context) => {
    const hasStart = Boolean(value.startTime);
    const hasEnd = Boolean(value.endTime);
    if (value.type === "AVAILABLE" && (!hasStart || !hasEnd)) {
      context.addIssue({ code: "custom", path: ["startTime"], message: "Available overrides need start and end times." });
    }
    if (hasStart !== hasEnd) {
      context.addIssue({ code: "custom", path: ["endTime"], message: "Provide both start and end times." });
    }
    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
    }
  });

export const availabilityInputSchema = z
  .object({
    rules: z.array(availabilityRuleSchema).max(40),
    overrides: z.array(availabilityOverrideSchema).max(100),
  })
  .superRefine((value, context) => {
    for (let day = 0; day < 7; day += 1) {
      const windows = value.rules
        .filter((rule) => rule.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let index = 1; index < windows.length; index += 1) {
        if (windows[index].startTime < windows[index - 1].endTime) {
          context.addIssue({ code: "custom", path: ["rules"], message: "Availability windows cannot overlap." });
          return;
        }
      }
    }
  });

export const profileSettingsInputSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  username: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  bio: z.string().trim().max(1000).default(""),
  image: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid image URL.").max(1000).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Use an http or https image URL."),
  ]).default(""),
  allowSearchEngineIndexing: z.boolean().default(false),
});

export const generalSettingsInputSchema = z.object({
  locale: z.enum(["en-ZA", "en-GB", "en-US"]),
  timeZone: z.string().refine(isValidIanaTimeZone, "Select a valid timezone."),
  timeFormat: z.enum(["TWELVE_HOUR", "TWENTY_FOUR_HOUR"]),
  weekStart: z.number().int().refine((value) => [0, 1, 6].includes(value), "Select a valid start of week."),
});

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date.");

export const outOfOfficeInputSchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    note: z.string().trim().max(160).default(""),
  })
  .superRefine((value, context) => {
    const start = new Date(`${value.startDate}T00:00:00.000Z`);
    const end = new Date(`${value.endDate}T00:00:00.000Z`);
    const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    if (durationDays < 0) context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date." });
    if (durationDays > 90) context.addIssue({ code: "custom", path: ["endDate"], message: "Out-of-office periods can be up to 90 days." });
  });

export type EventTypeInput = z.infer<typeof eventTypeInputSchema>;
export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;

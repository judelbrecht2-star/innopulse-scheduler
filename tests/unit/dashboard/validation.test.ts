import { describe, expect, it } from "vitest";

import { availabilityInputSchema, eventTypeInputSchema, generalSettingsInputSchema, outOfOfficeInputSchema, profileSettingsInputSchema, routingFormInputSchema, workflowInputSchema } from "@/server/dashboard/validation";

const eventType = {
  title: "Strategy Session",
  slug: "strategy-session",
  description: "",
  status: "ACTIVE" as const,
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minimumNoticeMinutes: 120,
  bookingWindowDays: 60,
  maxBookingsPerDay: null,
  requiresConfirmation: false,
  confirmationEmailEnabled: true,
  confirmationEmailSubject: "Your meeting is confirmed",
  confirmationEmailMessage: "Thank you for booking with us.",
  meetingAgenda: "Understand your goals\nAgree next steps",
  homeworkCtaLabel: "Complete the free assessment",
  homeworkCtaUrl: "https://innopulse.thegrowthsystem.co.za/",
  locationType: "GOOGLE_MEET" as const,
  locationValue: "",
  questions: [],
  schedulingType: "INDIVIDUAL" as const,
  hostIds: ["cmqk2lncf0001vd1w86xoo0u4"],
};

describe("dashboard validation", () => {
  it("accepts a valid event type", () => {
    expect(eventTypeInputSchema.safeParse(eventType).success).toBe(true);
  });

  it("rejects an unsafe booking slug", () => {
    expect(eventTypeInputSchema.safeParse({ ...eventType, slug: "Strategy Session!" }).success).toBe(false);
  });

  it("rejects overlapping weekly availability", () => {
    const result = availabilityInputSchema.safeParse({
      rules: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
        { dayOfWeek: 1, startTime: "12:30", endTime: "17:00" },
      ],
      overrides: [],
    });
    expect(result.success).toBe(false);
  });

  it("requires times for a special-hours override", () => {
    const result = availabilityInputSchema.safeParse({
      rules: [],
      overrides: [{ date: "2026-06-25", type: "AVAILABLE", startTime: null, endTime: null, note: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a two-route form", () => {
    expect(routingFormInputSchema.safeParse({ name: "Find a consultant", slug: "find-a-consultant", status: "ACTIVE", questionLabel: "What do you need?", options: [{ label: "Strategy", eventTypeId: "cmqk2lncf0001vd1w86xoo0u4" }, { label: "Delivery", eventTypeId: "cmqk2lncf0001vd1w86xoo0u4" }], fallbackEventTypeId: null }).success).toBe(true);
  });

  it("accepts a reminder workflow", () => {
    expect(workflowInputSchema.safeParse({ name: "Reminder", eventTypeId: null, status: "ACTIVE", trigger: "BEFORE_START", offsetMinutes: 1440, recipient: "INVITEE", subject: "Meeting reminder", body: "Your meeting starts {{start_time}}." }).success).toBe(true);
  });

  it("accepts valid profile and general preferences", () => {
    expect(profileSettingsInputSchema.safeParse({ name: "Judith Engelbrecht", username: "judith-engelbrecht", bio: "Innovation consultant", image: "", allowSearchEngineIndexing: false }).success).toBe(true);
    expect(generalSettingsInputSchema.safeParse({ locale: "en-ZA", timeZone: "Africa/Johannesburg", timeFormat: "TWELVE_HOUR", weekStart: 1 }).success).toBe(true);
  });

  it("rejects an out-of-office period longer than 90 days", () => {
    expect(outOfOfficeInputSchema.safeParse({ startDate: "2026-06-19", endDate: "2026-10-01", note: "Away" }).success).toBe(false);
  });
});

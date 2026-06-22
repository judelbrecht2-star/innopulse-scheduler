import { describe, expect, it } from "vitest";

import { generateSlots } from "@/server/availability/generate-slots";
import type { GenerateSlotsInput } from "@/server/availability/types";

const baseInput: GenerateSlotsInput = {
  selectedDate: "2026-06-22",
  inviteeTimeZone: "Africa/Johannesburg",
  hostTimeZone: "Africa/Johannesburg",
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minimumNoticeMinutes: 0,
  bookingWindowDays: 60,
  rules: [{ dayOfWeek: 1, startMinutes: 9 * 60, endMinutes: 17 * 60 }],
  overrides: [],
  busyIntervals: [],
  now: new Date("2026-06-19T00:00:00.000Z"),
};

describe("slot generation", () => {
  it("generates a full working day in the host timezone", () => {
    const slots = generateSlots(baseInput);

    expect(slots).toHaveLength(16);
    expect(slots[0]).toEqual({
      start: "2026-06-22T07:00:00.000Z",
      end: "2026-06-22T07:30:00.000Z",
    });
  });

  it("removes slots that overlap an existing busy period", () => {
    const slots = generateSlots({
      ...baseInput,
      busyIntervals: [
        { start: new Date("2026-06-22T08:00:00.000Z"), end: new Date("2026-06-22T09:00:00.000Z") },
      ],
    });

    expect(slots).toHaveLength(14);
    expect(slots.some((slot) => slot.start === "2026-06-22T08:00:00.000Z")).toBe(false);
  });

  it("honours an all-day unavailable override", () => {
    expect(
      generateSlots({
        ...baseInput,
        overrides: [{ date: "2026-06-22", type: "UNAVAILABLE" }],
      }),
    ).toHaveLength(0);
  });

  it("replaces weekly hours with date-specific available hours", () => {
    const slots = generateSlots({
      ...baseInput,
      overrides: [
        { date: "2026-06-22", type: "AVAILABLE", startMinutes: 13 * 60, endMinutes: 15 * 60 },
      ],
    });

    expect(slots).toHaveLength(4);
    expect(slots[0].start).toBe("2026-06-22T11:00:00.000Z");
  });

  it("returns the same instants in an invitee's local calendar day", () => {
    const slots = generateSlots({ ...baseInput, inviteeTimeZone: "America/New_York" });

    expect(slots).toHaveLength(16);
    expect(slots[0].start).toBe("2026-06-22T07:00:00.000Z");
  });
});

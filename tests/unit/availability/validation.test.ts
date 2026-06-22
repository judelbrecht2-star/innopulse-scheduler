import { describe, expect, it } from "vitest";

import { availabilityRuleSchema, scheduleSchema } from "@/server/availability/validation";

describe("availability validation", () => {
  it("accepts a normal working-hours window", () => {
    expect(
      availabilityRuleSchema.safeParse({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }).success,
    ).toBe(true);
  });

  it("rejects inverted working hours", () => {
    expect(
      availabilityRuleSchema.safeParse({ dayOfWeek: 1, startTime: "17:00", endTime: "09:00" }).success,
    ).toBe(false);
  });

  it("rejects non-IANA timezone names", () => {
    expect(scheduleSchema.safeParse({ name: "Work", timeZone: "Johannesburg", rules: [] }).success).toBe(false);
  });
});

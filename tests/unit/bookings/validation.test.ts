import { describe, expect, it } from "vitest";

import { bookingRequestSchema } from "@/server/bookings/validation";

const booking = {
  eventTypeId: "cmqk2lncf0001vd1w86xoo0u4",
  start: "2026-07-01T07:00:00.000Z",
  timeZone: "Africa/Johannesburg",
  inviteeName: "Ada Lovelace",
  inviteeEmail: "ada@example.com",
  idempotencyKey: "cd0274dc-04c6-432d-9b5a-02d0d4d8a610",
  answers: [],
};

describe("booking lifecycle validation", () => {
  it("accepts an opaque booking UID for rescheduling", () => {
    const result = bookingRequestSchema.safeParse({ ...booking, rescheduleUid: "cdb51e09-2065-4c6e-869f-227c7fb7f3d9" });
    expect(result.success).toBe(true);
  });

  it("rejects malformed reschedule identifiers", () => {
    const result = bookingRequestSchema.safeParse({ ...booking, rescheduleUid: "not-a-booking-id" });
    expect(result.success).toBe(false);
  });
});

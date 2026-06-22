import { describe, expect, it } from "vitest";

import { buildGoogleEventPayload } from "@/server/calendar/google-event-payload";

describe("Google Calendar event payload", () => {
  it("requests a unique Google Meet conference and includes the invitee", () => {
    const payload = buildGoogleEventPayload({
      uid: "booking-uid",
      title: "Strategy Session with Ada",
      description: "Innovation strategy review",
      inviteeName: "Ada Lovelace",
      inviteeEmail: "ada@example.com",
      inviteePhone: null,
      startAt: new Date("2026-07-01T07:00:00.000Z"),
      endAt: new Date("2026-07-01T07:30:00.000Z"),
      hostTimeZone: "Africa/Johannesburg",
      locationType: "GOOGLE_MEET",
      location: null,
      answers: [{ questionLabel: "Topic", value: "Roadmap" }],
      meetingAgenda: "Understand the opportunity\nAgree next steps",
      homeworkCtaLabel: "Complete the free assessment",
      homeworkCtaUrl: "https://innopulse.thegrowthsystem.co.za/assessment",
      manageUrl: "https://schedule.example.com/host/strategy/manage/booking-uid",
    });

    expect(payload.attendees).toEqual([{ email: "ada@example.com", displayName: "Ada Lovelace" }]);
    expect(payload.conferenceData?.createRequest.requestId).toBe("booking-booking-uid");
    expect(payload.conferenceData?.createRequest.conferenceSolutionKey.type).toBe("hangoutsMeet");
    expect(payload.description).toContain("Topic: Roadmap");
    expect(payload.description).toContain("• Understand the opportunity");
    expect(payload.description).toContain("Complete the free assessment");
    expect(payload.description).toContain("Manage booking: https://schedule.example.com/host/strategy/manage/booking-uid");
  });

  it("uses a physical location when Meet is not selected", () => {
    const payload = buildGoogleEventPayload({
      uid: "booking-uid",
      title: "On-site session",
      description: null,
      inviteeName: "Sam",
      inviteeEmail: "sam@example.com",
      inviteePhone: null,
      startAt: new Date("2026-07-01T07:00:00.000Z"),
      endAt: new Date("2026-07-01T08:00:00.000Z"),
      hostTimeZone: "Africa/Johannesburg",
      locationType: "IN_PERSON",
      location: "Innovation Lab",
      answers: [],
    });

    expect(payload).not.toHaveProperty("conferenceData");
    expect(payload.location).toBe("Innovation Lab");
  });
});

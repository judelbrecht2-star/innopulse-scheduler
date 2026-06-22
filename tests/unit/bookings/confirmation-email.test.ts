import { describe, expect, it } from "vitest";

import { buildBookingConfirmationEmail } from "@/server/bookings/confirmation-email";

describe("booking confirmation email", () => {
  it("includes the Meet link, agenda, homework, and RSVP request", () => {
    const email = buildBookingConfirmationEmail({
      inviteeName: "Alex Client",
      eventTitle: "Innovation Strategy Session",
      hostName: "Judith Engelbrecht",
      startAt: new Date("2026-06-22T08:00:00.000Z"),
      endAt: new Date("2026-06-22T08:30:00.000Z"),
      timeZone: "Africa/Johannesburg",
      subject: "Your meeting is confirmed",
      message: "Thank you for booking with us.",
      agenda: "Understand your goals\nAgree next steps",
      meetUrl: "https://meet.google.com/abc-defg-hij",
      homeworkLabel: "Complete the free assessment",
      homeworkUrl: "https://innopulse.thegrowthsystem.co.za/assessment",
      manageUrl: "https://schedule.example.com/host/event/manage/booking",
    });

    expect(email.text).toContain("Thank you for booking with us.");
    expect(email.text).toContain("• Understand your goals");
    expect(email.text).toContain("https://meet.google.com/abc-defg-hij");
    expect(email.text).toContain("Complete the free assessment");
    expect(email.text).toContain("accept the Google Calendar invitation");
    expect(email.html).toContain("Join Google Meet");
  });

  it("escapes client-controlled content in the HTML version", () => {
    const email = buildBookingConfirmationEmail({
      inviteeName: "<script>alert(1)</script>", eventTitle: "Session", hostName: "Host",
      startAt: new Date("2026-06-22T08:00:00.000Z"), endAt: new Date("2026-06-22T08:30:00.000Z"), timeZone: "Africa/Johannesburg",
      subject: "Confirmed", message: "Thanks", agenda: "", meetUrl: null, homeworkLabel: "", homeworkUrl: null, manageUrl: "https://example.com/manage",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

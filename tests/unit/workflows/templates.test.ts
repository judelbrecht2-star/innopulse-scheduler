import { describe, expect, it } from "vitest";

import { renderWorkflowTemplate, workflowScheduledFor } from "@/server/workflows/templates";

describe("workflow scheduling and templates", () => {
  const booking = { startAt: new Date("2026-07-02T08:00:00.000Z"), endAt: new Date("2026-07-02T08:30:00.000Z") };

  it("schedules reminders before the meeting", () => {
    expect(workflowScheduledFor("BEFORE_START", 1440, booking).toISOString()).toBe("2026-07-01T08:00:00.000Z");
  });

  it("schedules follow-ups after the meeting", () => {
    expect(workflowScheduledFor("AFTER_END", 120, booking).toISOString()).toBe("2026-07-02T10:30:00.000Z");
  });

  it("renders supported booking variables", () => {
    const result = renderWorkflowTemplate("Hi {{invitee_name}} — {{event_title}} starts {{start_time}}. {{manage_url}}", {
      inviteeName: "Ada", eventTitle: "Strategy Session", hostName: "Judith", startAt: booking.startAt,
      timeZone: "Africa/Johannesburg", meetUrl: null, manageUrl: "https://example.com/manage",
    });
    expect(result).toContain("Hi Ada");
    expect(result).toContain("Strategy Session");
    expect(result).toContain("https://example.com/manage");
  });
});

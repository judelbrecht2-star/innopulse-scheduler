import { addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";
import { emailDeliveryConfigured, sendWorkflowEmail } from "@/server/workflows/email";
import { renderWorkflowTemplate } from "@/server/workflows/templates";

export async function processWorkflowQueue(limit = 25) {
  if (!emailDeliveryConfigured()) return { configured: false, processed: 0, sent: 0, failed: 0 };
  const runs = await prisma.workflowRun.findMany({
    where: { status: "QUEUED", scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: "asc" }, take: limit,
    include: { workflow: true, booking: { include: { host: true, eventType: { include: { owner: true } }, calendarEvent: true } } },
  });
  let sent = 0; let failed = 0;
  for (const run of runs) {
    const claimed = await prisma.workflowRun.updateMany({ where: { id: run.id, status: "QUEUED" }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
    if (claimed.count !== 1) continue;
    const booking = run.booking;
    const username = booking.eventType.owner.username;
    const manageUrl = username ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/${username}/${booking.eventType.slug}/manage/${booking.uid}` : process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const context = { inviteeName: booking.inviteeName, eventTitle: booking.eventType.title, hostName: booking.host.name ?? booking.eventType.owner.name ?? "InnoPulse", startAt: booking.startAt, timeZone: booking.inviteeTimeZone, meetUrl: booking.calendarEvent?.conferenceUrl, manageUrl };
    const to = run.workflow.recipient === "HOST" ? booking.host.email : booking.inviteeEmail;
    try {
      if (!to) throw new Error("The recipient does not have an email address.");
      const providerMessageId = await sendWorkflowEmail({ to, subject: renderWorkflowTemplate(run.workflow.subject, context), text: renderWorkflowTemplate(run.workflow.body, context) });
      await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId, lastError: null } });
      sent += 1;
    } catch (error) {
      const attempts = run.attempts + 1;
      const terminal = attempts >= 5;
      await prisma.workflowRun.update({ where: { id: run.id }, data: { status: terminal ? "FAILED" : "QUEUED", scheduledFor: terminal ? run.scheduledFor : addMinutes(new Date(), Math.min(60, 5 * 2 ** attempts)), lastError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown delivery error" } });
      failed += 1;
    }
  }
  return { configured: true, processed: sent + failed, sent, failed };
}

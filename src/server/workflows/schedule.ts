import { prisma } from "@/lib/prisma";
import { workflowScheduledFor } from "@/server/workflows/templates";

export async function scheduleBookingWorkflows(bookingId: string, lifecycle: "created" | "canceled") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { eventType: { select: { ownerId: true } } },
  });
  if (!booking) return { scheduled: 0 };

  if (lifecycle === "canceled") {
    await prisma.workflowRun.updateMany({
      where: { bookingId, status: { in: ["QUEUED", "PROCESSING"] } },
      data: { status: "CANCELED" },
    });
  }

  const triggers = lifecycle === "canceled" ? ["BOOKING_CANCELED" as const] : ["BOOKING_CREATED" as const, "BEFORE_START" as const, "AFTER_END" as const];
  const workflows = await prisma.workflow.findMany({
    where: {
      ownerId: booking.eventType.ownerId,
      status: "ACTIVE",
      trigger: { in: triggers },
      OR: [{ eventTypeId: null }, { eventTypeId: booking.eventTypeId }],
    },
  });
  let scheduled = 0;
  for (const workflow of workflows) {
    const scheduledFor = workflowScheduledFor(workflow.trigger, workflow.offsetMinutes, booking);
    if (scheduledFor < new Date() && workflow.trigger === "BEFORE_START") continue;
    await prisma.workflowRun.upsert({
      where: { workflowId_bookingId: { workflowId: workflow.id, bookingId } },
      update: { scheduledFor, status: "QUEUED", attempts: 0, lastError: null, sentAt: null, providerMessageId: null },
      create: { workflowId: workflow.id, bookingId, scheduledFor },
    });
    scheduled += 1;
  }
  return { scheduled };
}

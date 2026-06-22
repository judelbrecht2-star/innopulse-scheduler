import { WorkflowManager } from "@/components/dashboard/workflow-manager";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { emailDeliveryConfigured } from "@/server/workflows/email";

export default async function WorkflowsPage() {
  const user = await requireHost(); if (!user) return null;
  const [workflows, eventTypes] = await Promise.all([
    prisma.workflow.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, include: { eventType: { select: { title: true } }, runs: { select: { status: true } } } }),
    prisma.eventType.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  return <WorkflowManager emailConfigured={emailDeliveryConfigured()} cronConfigured={Boolean(process.env.CRON_SECRET)} eventTypes={eventTypes} workflows={workflows.map((workflow) => ({ id: workflow.id, name: workflow.name, status: workflow.status, trigger: workflow.trigger, offsetMinutes: workflow.offsetMinutes, recipient: workflow.recipient, eventTypeTitle: workflow.eventType?.title ?? null, queued: workflow.runs.filter((run) => run.status === "QUEUED").length, sent: workflow.runs.filter((run) => run.status === "SENT").length, failed: workflow.runs.filter((run) => run.status === "FAILED").length }))} />;
}

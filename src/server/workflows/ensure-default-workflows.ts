import { prisma } from "@/lib/prisma";

const defaults = [
  {
    name: "24-hour invitee reminder",
    trigger: "BEFORE_START" as const,
    offsetMinutes: 1440,
    recipient: "INVITEE" as const,
    subject: "Reminder: {{event_title}} tomorrow",
    body: "Hi {{invitee_name}},\n\nThis is a reminder that {{event_title}} with {{host_name}} starts {{start_time}}.\n\nJoin: {{meet_link}}\n\nManage your booking: {{manage_url}}",
  },
  {
    name: "Two-hour follow-up",
    trigger: "AFTER_END" as const,
    offsetMinutes: 120,
    recipient: "INVITEE" as const,
    subject: "Thank you for meeting with {{host_name}}",
    body: "Hi {{invitee_name}},\n\nThank you for joining {{event_title}}. We hope the conversation was valuable.\n\nIf you need another conversation, you can manage your booking history here: {{manage_url}}",
  },
];

export async function ensureDefaultWorkflows(ownerId: string) {
  for (const workflow of defaults) {
    const existing = await prisma.workflow.findFirst({ where: { ownerId, name: workflow.name }, select: { id: true } });
    if (!existing) await prisma.workflow.create({ data: { ownerId, status: "ACTIVE", ...workflow } });
  }
}

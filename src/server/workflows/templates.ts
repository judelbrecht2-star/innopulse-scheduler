import { addMinutes, subMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { WorkflowTrigger } from "@prisma/client";

export function workflowScheduledFor(trigger: WorkflowTrigger, offsetMinutes: number, booking: { startAt: Date; endAt: Date }, now = new Date()) {
  if (trigger === "BEFORE_START") return subMinutes(booking.startAt, offsetMinutes);
  if (trigger === "AFTER_END") return addMinutes(booking.endAt, offsetMinutes);
  return now;
}

export function renderWorkflowTemplate(template: string, context: {
  inviteeName: string; eventTitle: string; hostName: string; startAt: Date; timeZone: string;
  meetUrl?: string | null; manageUrl: string;
}) {
  const variables: Record<string, string> = {
    invitee_name: context.inviteeName,
    event_title: context.eventTitle,
    host_name: context.hostName,
    start_time: formatInTimeZone(context.startAt, context.timeZone, "EEEE, d MMMM yyyy 'at' h:mm a zzz"),
    meet_link: context.meetUrl || "Your calendar invitation contains the meeting details.",
    manage_url: context.manageUrl,
  };
  return template.replace(/{{\s*([a-z_]+)\s*}}/g, (match, key: string) => variables[key] ?? match);
}

import { notFound } from "next/navigation";

import { EventTypeForm } from "@/components/dashboard/event-type-form";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function EditEventTypePage({ params }: { params: Promise<{ eventTypeId: string }> }) {
  const user = await requireHost();
  if (!user?.username) return null;
  const { eventTypeId } = await params;
  const [eventType, team] = await Promise.all([
    prisma.eventType.findFirst({ where: { id: eventTypeId, ownerId: user.id }, include: { questions: { orderBy: { position: "asc" } }, hosts: { orderBy: [{ isPrimary: "desc" }, { priority: "asc" }] } } }),
    prisma.team.findFirst({ where: { ownerId: user.id }, include: { members: { include: { user: true }, orderBy: { createdAt: "asc" } } } }),
  ]);
  if (!eventType) notFound();
  const members = team?.members.map((member) => ({ id: member.user.id, name: member.user.name ?? member.user.email ?? "Team member", email: member.user.email ?? "" })) ?? [{ id: user.id, name: user.name ?? "Host", email: user.email ?? "" }];
  return <EventTypeForm username={user.username} members={members} initialValue={{ id: eventType.id, title: eventType.title, slug: eventType.slug, description: eventType.description ?? "", status: eventType.status === "DRAFT" ? "DRAFT" : "ACTIVE", durationMinutes: eventType.durationMinutes, slotIntervalMinutes: eventType.slotIntervalMinutes ?? eventType.durationMinutes, bufferBeforeMinutes: eventType.bufferBeforeMinutes, bufferAfterMinutes: eventType.bufferAfterMinutes, minimumNoticeMinutes: eventType.minimumNoticeMinutes, bookingWindowDays: eventType.bookingWindowDays, maxBookingsPerDay: eventType.maxBookingsPerDay, requiresConfirmation: eventType.requiresConfirmation, confirmationEmailEnabled: eventType.confirmationEmailEnabled, confirmationEmailSubject: eventType.confirmationEmailSubject, confirmationEmailMessage: eventType.confirmationEmailMessage, meetingAgenda: eventType.meetingAgenda, homeworkCtaLabel: eventType.homeworkCtaLabel, homeworkCtaUrl: eventType.homeworkCtaUrl ?? "", locationType: eventType.locationType, locationValue: eventType.locationValue ?? "", questions: eventType.questions.map((question) => ({ type: question.type, label: question.label, placeholder: question.placeholder ?? "", helpText: question.helpText ?? "", required: question.required, options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : [] })), schedulingType: eventType.schedulingType, hostIds: eventType.hosts.map((host) => host.userId) }} />;
}

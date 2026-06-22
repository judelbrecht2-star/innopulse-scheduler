import { EventTypeForm } from "@/components/dashboard/event-type-form";
import { requireHost } from "@/server/dashboard/require-host";
import { prisma } from "@/lib/prisma";

export default async function NewEventTypePage() {
  const user = await requireHost();
  if (!user?.username) return null;
  const team = await prisma.team.findFirst({ where: { ownerId: user.id }, include: { members: { include: { user: true }, orderBy: { createdAt: "asc" } } } });
  const members = team?.members.map((member) => ({ id: member.user.id, name: member.user.name ?? member.user.email ?? "Team member", email: member.user.email ?? "" })) ?? [{ id: user.id, name: user.name ?? "Host", email: user.email ?? "" }];
  return <EventTypeForm username={user.username} members={members} initialValue={{ title: "", slug: "", description: "", status: "ACTIVE", durationMinutes: 30, slotIntervalMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, minimumNoticeMinutes: 120, bookingWindowDays: 60, maxBookingsPerDay: null, requiresConfirmation: false, confirmationEmailEnabled: true, confirmationEmailSubject: "Your meeting is confirmed", confirmationEmailMessage: "Thank you for booking time with us. We are looking forward to the conversation.", meetingAgenda: "Understand your goals\nExplore the current challenge\nAgree practical next steps", homeworkCtaLabel: "Complete the free assessment", homeworkCtaUrl: "https://innopulse.thegrowthsystem.co.za/", locationType: "GOOGLE_MEET", locationValue: "", questions: [], schedulingType: "INDIVIDUAL", hostIds: [user.id] }} />;
}

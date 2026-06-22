import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { eventTypeInputSchema } from "@/server/dashboard/validation";

export async function POST(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = eventTypeInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const schedule = await prisma.schedule.findFirst({
    where: { ownerId: user.id, isDefault: true },
    select: { id: true },
  });
  if (!schedule) return NextResponse.json({ error: "Create an availability schedule first." }, { status: 409 });

  const input = parsed.data;
  const team = await prisma.team.findFirst({
    where: { ownerId: user.id },
    include: { members: { select: { userId: true } } },
  });
  const allowedMembers = new Set(team?.members.map((member) => member.userId) ?? [user.id]);
  const hostIds = input.hostIds.length ? input.hostIds : [user.id];
  if (hostIds.some((hostId) => !allowedMembers.has(hostId))) return NextResponse.json({ error: "Select hosts from your team." }, { status: 400 });
  try {
    const eventType = await prisma.eventType.create({
      data: {
        ownerId: user.id,
        scheduleId: schedule.id,
        teamId: team?.id,
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        status: input.status,
        durationMinutes: input.durationMinutes,
        slotIntervalMinutes: input.slotIntervalMinutes,
        bufferBeforeMinutes: input.bufferBeforeMinutes,
        bufferAfterMinutes: input.bufferAfterMinutes,
        minimumNoticeMinutes: input.minimumNoticeMinutes,
        bookingWindowDays: input.bookingWindowDays,
        maxBookingsPerDay: input.maxBookingsPerDay,
        requiresConfirmation: input.requiresConfirmation,
        confirmationEmailEnabled: input.confirmationEmailEnabled,
        confirmationEmailSubject: input.confirmationEmailSubject,
        confirmationEmailMessage: input.confirmationEmailMessage,
        meetingAgenda: input.meetingAgenda,
        homeworkCtaLabel: input.homeworkCtaLabel,
        homeworkCtaUrl: input.homeworkCtaUrl || null,
        locationType: input.locationType,
        locationValue: input.locationValue || null,
        schedulingType: input.schedulingType,
        hosts: { create: hostIds.map((userId, index) => ({ userId, isPrimary: index === 0, priority: index })) },
        questions: {
          create: input.questions.map((question, position) => ({
            ...question,
            placeholder: question.placeholder || null,
            helpText: question.helpText || null,
            options: question.options.length ? question.options : Prisma.JsonNull,
            position,
          })),
        },
      },
      select: { id: true },
    });
    return NextResponse.json(eventType, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That booking link is already in use." }, { status: 409 });
    }
    throw error;
  }
}

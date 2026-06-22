import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { datesInRange, groupOutOfOfficeOverrides } from "@/server/availability/out-of-office";
import { requireHost } from "@/server/dashboard/require-host";
import { outOfOfficeInputSchema } from "@/server/dashboard/validation";

async function defaultSchedule(userId: string) {
  return prisma.schedule.findFirst({ where: { ownerId: userId, isDefault: true }, select: { id: true } });
}

async function periodsForSchedule(scheduleId: string) {
  const overrides = await prisma.availabilityOverride.findMany({
    where: { scheduleId, type: "UNAVAILABLE" },
    orderBy: { date: "asc" },
    select: { date: true, note: true },
  });
  return groupOutOfOfficeOverrides(overrides);
}

export async function POST(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = outOfOfficeInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const schedule = await defaultSchedule(user.id);
  if (!schedule) return NextResponse.json({ error: "Default schedule not found." }, { status: 404 });
  const dates = datesInRange(parsed.data.startDate, parsed.data.endDate);

  await prisma.$transaction(async (transaction) => {
    await transaction.availabilityOverride.deleteMany({ where: { scheduleId: schedule.id, date: { in: dates } } });
    await transaction.availabilityOverride.createMany({
      data: dates.map((date) => ({ scheduleId: schedule.id, date, type: "UNAVAILABLE" as const, note: parsed.data.note || null })),
    });
  });

  return NextResponse.json({ saved: true, periods: await periodsForSchedule(schedule.id) });
}

export async function DELETE(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = outOfOfficeInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const schedule = await defaultSchedule(user.id);
  if (!schedule) return NextResponse.json({ error: "Default schedule not found." }, { status: 404 });
  await prisma.availabilityOverride.deleteMany({
    where: {
      scheduleId: schedule.id,
      type: "UNAVAILABLE",
      date: { gte: new Date(`${parsed.data.startDate}T00:00:00.000Z`), lte: new Date(`${parsed.data.endDate}T00:00:00.000Z`) },
    },
  });

  return NextResponse.json({ saved: true, periods: await periodsForSchedule(schedule.id) });
}

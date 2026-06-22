import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { availabilityInputSchema } from "@/server/dashboard/validation";

function databaseTime(value: string | null) {
  return value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
}

export async function PUT(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = availabilityInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const schedule = await prisma.schedule.findFirst({
    where: { ownerId: user.id, isDefault: true },
    select: { id: true },
  });
  if (!schedule) return NextResponse.json({ error: "Default schedule not found." }, { status: 404 });

  await prisma.$transaction(async (transaction) => {
    await transaction.availabilityRule.deleteMany({ where: { scheduleId: schedule.id } });
    await transaction.availabilityOverride.deleteMany({ where: { scheduleId: schedule.id } });

    if (parsed.data.rules.length) {
      await transaction.availabilityRule.createMany({
        data: parsed.data.rules.map((rule) => ({
          scheduleId: schedule.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: databaseTime(rule.startTime)!,
          endTime: databaseTime(rule.endTime)!,
        })),
      });
    }

    if (parsed.data.overrides.length) {
      await transaction.availabilityOverride.createMany({
        data: parsed.data.overrides.map((override) => ({
          scheduleId: schedule.id,
          date: new Date(`${override.date}T00:00:00.000Z`),
          type: override.type,
          startTime: databaseTime(override.startTime),
          endTime: databaseTime(override.endTime),
          note: override.note || null,
        })),
      });
    }
  });

  return NextResponse.json({ saved: true });
}

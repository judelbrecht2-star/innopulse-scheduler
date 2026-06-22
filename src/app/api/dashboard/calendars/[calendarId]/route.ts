import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

const updateSchema = z.object({
  isConflictCalendar: z.boolean().optional(),
  isDestination: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, context: { params: Promise<{ calendarId: string }> }) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { calendarId } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid calendar setting." }, { status: 400 });

  const calendar = await prisma.externalCalendar.findFirst({
    where: { id: calendarId, connection: { userId: user.id } },
  });
  if (!calendar) return NextResponse.json({ error: "Calendar not found." }, { status: 404 });
  if (parsed.data.isDestination && calendar.readOnly) {
    return NextResponse.json({ error: "A read-only calendar cannot receive new bookings." }, { status: 409 });
  }

  await prisma.$transaction(async (transaction) => {
    if (parsed.data.isDestination) {
      await transaction.externalCalendar.updateMany({
        where: { connectionId: calendar.connectionId },
        data: { isDestination: false },
      });
    }
    await transaction.externalCalendar.update({
      where: { id: calendar.id },
      data: parsed.data,
    });
  });
  return NextResponse.json({ saved: true });
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { generalSettingsInputSchema } from "@/server/dashboard/validation";

export async function PUT(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = generalSettingsInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: parsed.data }),
    prisma.schedule.updateMany({ where: { ownerId: user.id, isDefault: true }, data: { timeZone: parsed.data.timeZone } }),
  ]);

  return NextResponse.json({ saved: true });
}

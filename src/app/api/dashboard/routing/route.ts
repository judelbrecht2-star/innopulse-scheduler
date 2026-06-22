import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { routingFormInputSchema } from "@/server/dashboard/validation";

export async function POST(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = routingFormInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid routing form." }, { status: 400 });
  const input = parsed.data;
  const eventTypeIds = [...new Set([...input.options.map((option) => option.eventTypeId), ...(input.fallbackEventTypeId ? [input.fallbackEventTypeId] : [])])];
  const ownedCount = await prisma.eventType.count({ where: { ownerId: user.id, id: { in: eventTypeIds }, status: input.status === "ACTIVE" ? "ACTIVE" : { not: "ARCHIVED" } } });
  if (ownedCount !== eventTypeIds.length) return NextResponse.json({ error: "Select event types from your workspace." }, { status: 400 });
  const team = await prisma.team.findFirst({ where: { ownerId: user.id }, select: { id: true } });

  try {
    const routingForm = await prisma.routingForm.create({
      data: {
        ownerId: user.id,
        teamId: team?.id,
        fallbackEventTypeId: input.fallbackEventTypeId,
        name: input.name,
        slug: input.slug,
        status: input.status,
        question: { label: input.questionLabel, options: input.options.map((option) => option.label) },
        routes: Object.fromEntries(input.options.map((option) => [option.label, option.eventTypeId])),
      },
      select: { id: true },
    });
    return NextResponse.json(routingForm, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "That routing link is already in use." }, { status: 409 });
    throw error;
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { workflowInputSchema } from "@/server/dashboard/validation";

export async function POST(request: Request) {
  const user = await requireHost(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = workflowInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid workflow." }, { status: 400 });
  if (parsed.data.eventTypeId) {
    const eventType = await prisma.eventType.findFirst({ where: { id: parsed.data.eventTypeId, ownerId: user.id }, select: { id: true } });
    if (!eventType) return NextResponse.json({ error: "Event type not found." }, { status: 404 });
  }
  const workflow = await prisma.workflow.create({ data: { ownerId: user.id, ...parsed.data }, select: { id: true } });
  return NextResponse.json(workflow, { status: 201 });
}

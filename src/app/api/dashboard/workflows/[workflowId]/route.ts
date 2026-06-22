import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

const statusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ workflowId: string }> }) {
  const user = await requireHost(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid workflow status." }, { status: 400 });
  const { workflowId } = await context.params;
  const result = await prisma.workflow.updateMany({ where: { id: workflowId, ownerId: user.id }, data: { status: parsed.data.status } });
  if (result.count !== 1) return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  if (parsed.data.status === "PAUSED") await prisma.workflowRun.updateMany({ where: { workflowId, status: "QUEUED" }, data: { status: "CANCELED" } });
  return NextResponse.json({ saved: true });
}

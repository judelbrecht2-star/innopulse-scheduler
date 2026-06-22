import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

const memberSchema = z.object({ email: z.string().trim().email(), role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER") });

export async function POST(request: Request, context: { params: Promise<{ teamId: string }> }) {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await context.params;
  const parsed = memberSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid member email." }, { status: 400 });
  const team = await prisma.team.findFirst({ where: { id: teamId, ownerId: host.id }, select: { id: true } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, name: true, email: true } });
  if (!user) return NextResponse.json({ error: "That person must sign in once before they can be added." }, { status: 409 });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: { role: parsed.data.role },
    create: { teamId, userId: user.id, role: parsed.data.role },
  });
  return NextResponse.json(user, { status: 201 });
}

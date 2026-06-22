import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { profileSettingsInputSchema } from "@/server/dashboard/validation";

export async function PUT(request: Request) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileSettingsInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const usernameOwner = await prisma.user.findUnique({ where: { username: parsed.data.username }, select: { id: true } });
  if (usernameOwner && usernameOwner.id !== user.id) {
    return NextResponse.json({ error: "That public username is already in use." }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      bio: parsed.data.bio || null,
      image: parsed.data.image || null,
      allowSearchEngineIndexing: parsed.data.allowSearchEngineIndexing,
    },
    select: { name: true, username: true, bio: true, image: true, allowSearchEngineIndexing: true },
  });

  return NextResponse.json({ saved: true, profile: updated });
}

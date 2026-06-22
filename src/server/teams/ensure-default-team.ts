import { prisma } from "@/lib/prisma";

export async function ensureDefaultTeam(userId: string, name = "InnoPulse") {
  const team = await prisma.team.upsert({
    where: { ownerId_slug: { ownerId: userId, slug: "innopulse" } },
    update: { name },
    create: { ownerId: userId, name, slug: "innopulse" },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId } },
    update: { role: "OWNER" },
    create: { teamId: team.id, userId, role: "OWNER" },
  });
  await prisma.eventType.updateMany({
    where: { ownerId: userId, teamId: null },
    data: { teamId: team.id },
  });
  return team;
}

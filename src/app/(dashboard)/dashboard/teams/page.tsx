import { TeamManager } from "@/components/dashboard/team-manager";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";
import { ensureDefaultTeam } from "@/server/teams/ensure-default-team";

export default async function TeamsPage() {
  const user = await requireHost();
  if (!user) return null;
  await ensureDefaultTeam(user.id, "InnoPulse");
  const team = await prisma.team.findFirstOrThrow({ where: { ownerId: user.id }, include: { members: { include: { user: true }, orderBy: { createdAt: "asc" } } } });
  return <TeamManager team={{ id: team.id, name: team.name, slug: team.slug, members: team.members.map((member) => ({ id: member.userId, name: member.user.name ?? member.user.email ?? "Team member", email: member.user.email ?? "", role: member.role })) }} />;
}

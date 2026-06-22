import { prisma } from "../src/lib/prisma";
import { ensureDefaultTeam } from "../src/server/teams/ensure-default-team";

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true } });
    for (const user of users) await ensureDefaultTeam(user.id, "InnoPulse");
    console.info(JSON.stringify({ usersProcessed: users.length, teamsReady: users.length }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

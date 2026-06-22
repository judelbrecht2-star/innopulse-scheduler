import { prisma } from "../src/lib/prisma";
import { ensureDefaultWorkflows } from "../src/server/workflows/ensure-default-workflows";

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) await ensureDefaultWorkflows(user.id);
    console.info(JSON.stringify({ usersProcessed: users.length, defaultWorkflowsPerUser: 2 }));
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

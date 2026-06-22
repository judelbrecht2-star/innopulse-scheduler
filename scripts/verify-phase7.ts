import { prisma } from "../src/lib/prisma";
import { processWorkflowQueue } from "../src/server/workflows/worker";

async function main() {
  try {
    const workflows = await prisma.workflow.findMany({ include: { runs: true }, orderBy: { createdAt: "asc" } });
    const worker = await processWorkflowQueue();
    const cronResponse = await fetch("http://localhost:3000/api/cron/workflows", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
    });
    console.info(JSON.stringify({
      workflowCount: workflows.length,
      activeWorkflowCount: workflows.filter((workflow) => workflow.status === "ACTIVE").length,
      queuedRunCount: workflows.flatMap((workflow) => workflow.runs).filter((run) => run.status === "QUEUED").length,
      emailDeliveryConfigured: worker.configured,
      deliveryAttempted: worker.processed > 0,
      protectedCronStatus: cronResponse.status,
    }));
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

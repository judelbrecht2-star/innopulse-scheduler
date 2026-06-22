import { NextResponse } from "next/server";

import { processWorkflowQueue } from "@/server/workflows/worker";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Workflow cron is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await processWorkflowQueue());
}

export const GET = run;
export const POST = run;

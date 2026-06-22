import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const team = await prisma.team.findFirst({
      include: { members: true, eventTypes: { include: { hosts: true } } },
    });
    const eventType = team?.eventTypes.find((event) => event.status === "ACTIVE");
    if (!team || !eventType) throw new Error("Phase 6 team or event type was not found.");
    const response = await fetch(`http://localhost:3000/api/availability/${eventType.id}/slots?date=2026-06-23&timeZone=Africa%2FJohannesburg`);
    const payload = await response.json() as { slots?: unknown[]; error?: string };
    console.info(JSON.stringify({
      teamName: team.name,
      teamMemberCount: team.members.length,
      eventTypeScheduling: eventType.schedulingType,
      configuredHostCount: eventType.hosts.length,
      routingFormCount: await prisma.routingForm.count(),
      publicAvailabilityStatus: response.status,
      publicSlotCount: payload.slots?.length ?? 0,
      publicAvailabilityError: payload.error ?? null,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

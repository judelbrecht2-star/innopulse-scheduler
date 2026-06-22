import { prisma } from "@/lib/prisma";
import { ensureDefaultEventType } from "@/server/event-types/ensure-default-event-type";
import { ensureDefaultTeam } from "@/server/teams/ensure-default-team";
import { ensureDefaultWorkflows } from "@/server/workflows/ensure-default-workflows";

const DEFAULT_TIME_ZONE = "Africa/Johannesburg";

function slugifyUsername(input: string) {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || "host";
}

async function findAvailableUsername(base: string) {
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function provisionNewHost(user: { id: string; email?: string | null; name?: string | null }) {
  let schedule = await prisma.schedule.findFirst({
    where: { ownerId: user.id, isDefault: true },
    select: { id: true },
  });

  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { username: true },
  });

  if (!currentUser.username) {
    const usernameSource = user.name || user.email?.split("@")[0] || "host";
    const username = await findAvailableUsername(slugifyUsername(usernameSource));
    await prisma.user.update({
      where: { id: user.id },
      data: { username, timeZone: DEFAULT_TIME_ZONE, locale: "en-ZA" },
    });
  }

  if (!schedule) {
    const workday = new Date("1970-01-01T09:00:00.000Z");
    const closeOfDay = new Date("1970-01-01T17:00:00.000Z");
    schedule = await prisma.schedule.create({
      data: {
        ownerId: user.id,
        name: "Working hours",
        timeZone: DEFAULT_TIME_ZONE,
        isDefault: true,
        availabilityRules: {
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: workday,
            endTime: closeOfDay,
          })),
        },
      },
      select: { id: true },
    });
  }

  await ensureDefaultEventType(user.id, schedule.id);
  await ensureDefaultTeam(user.id, "InnoPulse");
  await ensureDefaultWorkflows(user.id);
}

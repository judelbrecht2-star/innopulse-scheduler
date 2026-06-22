import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      timeZone: true,
      locale: true,
      accounts: {
        select: {
          provider: true,
          access_token: true,
          refresh_token: true,
        },
      },
      sessions: { select: { id: true } },
      schedules: {
        where: { isDefault: true },
        select: {
          name: true,
          timeZone: true,
          availabilityRules: {
            orderBy: { dayOfWeek: "asc" },
            select: { dayOfWeek: true },
          },
        },
      },
    },
  });

  if (!user) throw new Error("No provisioned host was found.");

  const googleAccount = user.accounts.find(({ provider }) => provider === "google");
  const defaultSchedule = user.schedules[0];

  console.info(
    JSON.stringify({
      usernameCreated: Boolean(user.username),
      timeZone: user.timeZone,
      locale: user.locale,
      googleAccountCreated: Boolean(googleAccount),
      accessTokenStored: Boolean(googleAccount?.access_token),
      refreshTokenStored: Boolean(googleAccount?.refresh_token),
      sessionCreated: user.sessions.length > 0,
      defaultSchedule: defaultSchedule?.name ?? null,
      scheduleTimeZone: defaultSchedule?.timeZone ?? null,
      workingDays: defaultSchedule?.availabilityRules.map(({ dayOfWeek }) => dayOfWeek) ?? [],
    }),
  );
} finally {
  await prisma.$disconnect();
}

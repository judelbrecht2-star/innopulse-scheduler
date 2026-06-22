import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const account = await prisma.account.findFirst({
    where: { provider: "google" },
    include: {
      calendarConnection: {
        include: { calendars: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] } },
      },
    },
  });

  console.info(JSON.stringify(account ? {
    accountFound: true,
    hasAccessToken: Boolean(account.access_token),
    hasRefreshToken: Boolean(account.refresh_token),
    expiresAt: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
    grantedScopes: account.scope?.split(" ").filter((scope) => scope.includes("calendar")) ?? [],
    connectionFound: Boolean(account.calendarConnection),
    connectionStatus: account.calendarConnection?.status ?? null,
    calendarCount: account.calendarConnection?.calendars.length ?? 0,
    primaryCalendarFound: account.calendarConnection?.calendars.some((calendar) => calendar.isPrimary) ?? false,
  } : { accountFound: false }));
} finally {
  await prisma.$disconnect();
}

import { addDays } from "date-fns";

import { prisma } from "../src/lib/prisma";
import { getGoogleBusyIntervals, syncGoogleCalendars } from "../src/server/calendar/google-calendar";

async function main() {
try {
  const user = await prisma.user.findFirst({
    where: { accounts: { some: { provider: "google" } } },
    select: { id: true },
  });
  if (!user) throw new Error("No Google host account was found.");

  const calendars = await syncGoogleCalendars(user.id);
  const busy = await getGoogleBusyIntervals(user.id, new Date(), addDays(new Date(), 7));
  const connection = await prisma.calendarConnection.findFirst({
    where: { userId: user.id, provider: "GOOGLE" },
    select: { status: true, lastSyncedAt: true },
  });

  console.info(JSON.stringify({
    connectionStatus: connection?.status ?? null,
    tokenRefreshSucceeded: true,
    calendarCount: calendars.length,
    primaryCalendarFound: calendars.some((calendar) => calendar.isPrimary),
    conflictCalendarCount: calendars.filter((calendar) => calendar.isConflictCalendar).length,
    destinationCalendarFound: calendars.some((calendar) => calendar.isDestination),
    freeBusyQuerySucceeded: true,
    busyIntervalCount: busy.length,
  }));
} finally {
  await prisma.$disconnect();
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Google Calendar verification failed.");
  process.exitCode = 1;
});

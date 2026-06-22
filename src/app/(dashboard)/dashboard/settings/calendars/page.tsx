import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { CalendarSettings } from "@/components/dashboard/calendar-settings";
import { SettingsPageHeader } from "@/components/dashboard/settings-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ensureGoogleCalendarConnection } from "@/server/calendar/google-calendar";
import { requireHost } from "@/server/dashboard/require-host";

export default async function CalendarSettingsPage() {
  const sessionUser = await requireHost();
  if (!sessionUser) return null;
  await ensureGoogleCalendarConnection(sessionUser.id);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: { calendarConnections: { where: { provider: "GOOGLE" }, include: { calendars: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] } } } },
  });
  const connection = user.calendarConnections[0];

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <SettingsPageHeader eyebrow="Personal settings" title="Calendar connections" description="Choose which calendars block availability and where new meetings should be created." />
      <div className="mt-8">
        {connection ? <CalendarSettings providerEmail={connection.providerEmail ?? user.email ?? "Google account"} status={connection.status} lastSyncedLabel={connection.lastSyncedAt ? formatInTimeZone(connection.lastSyncedAt, user.timeZone, "d MMM yyyy, h:mm a") : null} calendars={connection.calendars.map((calendar) => ({ id: calendar.id, name: calendar.name, timeZone: calendar.timeZone, isPrimary: calendar.isPrimary, isConflictCalendar: calendar.isConflictCalendar, isDestination: calendar.isDestination, readOnly: calendar.readOnly }))} /> : <Card><CardContent className="p-6"><h2 className="text-xl">Google Calendar is not connected</h2><p className="mt-2 text-sm text-muted-foreground">Sign in with Google again to grant calendar access.</p><Link className="mt-5 inline-flex rounded-button bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" href="/api/auth/signin/google?callbackUrl=/dashboard/settings/calendars">Connect Google Calendar</Link></CardContent></Card>}
      </div>
    </main>
  );
}

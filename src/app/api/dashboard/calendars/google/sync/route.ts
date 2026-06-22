import { NextResponse } from "next/server";

import { requireHost } from "@/server/dashboard/require-host";
import { GoogleCalendarError, syncGoogleCalendars } from "@/server/calendar/google-calendar";

export async function POST() {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const calendars = await syncGoogleCalendars(user.id);
    return NextResponse.json({
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        name: calendar.name,
        isPrimary: calendar.isPrimary,
        isConflictCalendar: calendar.isConflictCalendar,
        isDestination: calendar.isDestination,
        readOnly: calendar.readOnly,
      })),
    });
  } catch (error) {
    if (error instanceof GoogleCalendarError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}

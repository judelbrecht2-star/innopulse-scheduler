import { NextResponse } from "next/server";
import { z } from "zod";

import { getAvailableSlots } from "@/server/availability/get-available-slots";
import { isValidIanaTimeZone } from "@/server/availability/timezone";
import { GoogleCalendarError } from "@/server/calendar/google-calendar";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().refine(isValidIanaTimeZone),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ eventTypeId: string }> },
) {
  const { eventTypeId } = await context.params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date"),
    timeZone: url.searchParams.get("timeZone"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date or timezone." }, { status: 400 });
  }

  let result;
  try {
    result = await getAvailableSlots(eventTypeId, parsed.data.date, parsed.data.timeZone);
  } catch (error) {
    if (error instanceof GoogleCalendarError) {
      return NextResponse.json({ error: "Calendar availability is temporarily unavailable." }, { status: 503 });
    }
    throw error;
  }
  if (!result) return NextResponse.json({ error: "Event type not found." }, { status: 404 });

  return NextResponse.json(
    { slots: result.slots, date: parsed.data.date, timeZone: parsed.data.timeZone },
    { headers: { "Cache-Control": "no-store" } },
  );
}

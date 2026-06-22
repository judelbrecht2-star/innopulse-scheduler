import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/server/bookings/confirmation-email";
import { createGoogleCalendarEvent } from "@/server/calendar/google-calendar";
import { requireHost } from "@/server/dashboard/require-host";

export async function POST(_request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { bookingId } = await context.params;
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, hostId: user.id },
    select: { id: true, status: true, startAt: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "CONFIRMED" || booking.startAt <= new Date()) {
    return NextResponse.json({ error: "Only upcoming confirmed bookings can create a Meet link." }, { status: 409 });
  }

  try {
    const event = await createGoogleCalendarEvent(booking.id);
    if (!event?.conferenceUrl) return NextResponse.json({ error: "Google did not return a Meet link. Reconnect the calendar and try again." }, { status: 502 });
    try { await sendBookingConfirmationEmail(booking.id); } catch (error) { console.error("Booking confirmation email failed", error); }
    return NextResponse.json({ conferenceUrl: event.conferenceUrl });
  } catch (error) {
    console.error("Google Meet creation failed", error);
    return NextResponse.json({ error: "Unable to create the Google Meet right now." }, { status: 502 });
  }
}

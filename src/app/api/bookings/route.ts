import { NextResponse } from "next/server";

import { BookingConflictError, createBooking } from "@/server/bookings/create-booking";
import { sendBookingConfirmationEmail } from "@/server/bookings/confirmation-email";
import { bookingRequestSchema } from "@/server/bookings/validation";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/server/calendar/google-calendar";
import { scheduleBookingWorkflows } from "@/server/workflows/schedule";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the booking details and try again.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const booking = await createBooking(parsed.data);
    let conferenceUrl: string | null = null;
    let calendarSync: "created" | "pending" | "not_required" = "not_required";
    let confirmationEmail: "sent" | "pending" | "not_configured" | "not_required" = "not_required";
    if (booking.status === "CONFIRMED") {
      try {
        if (booking.rescheduledFromId) await deleteGoogleCalendarEvent(booking.rescheduledFromId);
        const calendarEvent = await createGoogleCalendarEvent(booking.id);
        conferenceUrl = calendarEvent?.conferenceUrl ?? null;
        calendarSync = calendarEvent ? "created" : "pending";
      } catch (calendarError) {
        calendarSync = "pending";
        console.error("Google Calendar event creation failed", calendarError);
      }
      try {
        const delivery = await sendBookingConfirmationEmail(booking.id);
        confirmationEmail = delivery.status === "sent" || delivery.status === "already_sent"
          ? "sent"
          : delivery.status === "not_configured" ? "not_configured" : delivery.status === "calendar_pending" ? "pending" : "not_required";
      } catch (emailError) {
        confirmationEmail = "pending";
        console.error("Booking confirmation email failed", emailError);
      }
    }
    try {
      if (booking.rescheduledFromId) await scheduleBookingWorkflows(booking.rescheduledFromId, "canceled");
      await scheduleBookingWorkflows(booking.id, "created");
    } catch (workflowError) {
      console.error("Workflow scheduling failed", workflowError);
    }
    return NextResponse.json({ uid: booking.uid, status: booking.status, conferenceUrl, calendarSync, confirmationEmail }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Booking creation failed", error);
    return NextResponse.json({ error: "Unable to create this booking." }, { status: 500 });
  }
}

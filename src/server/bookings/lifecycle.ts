import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/server/bookings/confirmation-email";
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/server/calendar/google-calendar";
import { scheduleBookingWorkflows } from "@/server/workflows/schedule";

export class BookingLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingLifecycleError";
  }
}

export type HostBookingAction = "confirm" | "reject" | "cancel" | "no_show";

async function scheduleCancellationSafely(bookingId: string) {
  try { await scheduleBookingWorkflows(bookingId, "canceled"); }
  catch (error) { console.error("Cancellation workflow scheduling failed", error); }
}

export async function updateBookingAsHost(bookingId: string, hostId: string, action: HostBookingAction, reason?: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, hostId }, select: { id: true, status: true, startAt: true } });
  if (!booking) throw new BookingLifecycleError("Booking not found.");

  let calendarSync: "updated" | "pending" | "not_required" = "not_required";
  if (action === "confirm") {
    if (booking.status !== "PENDING") throw new BookingLifecycleError("Only pending bookings can be confirmed.");
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
    try {
      const event = await createGoogleCalendarEvent(booking.id);
      calendarSync = event ? "updated" : "pending";
    } catch (error) {
      calendarSync = "pending";
      console.error("Google Calendar confirmation sync failed", error);
    }
    try { await sendBookingConfirmationEmail(booking.id); }
    catch (error) { console.error("Booking confirmation email failed", error); }
  } else if (action === "reject") {
    if (booking.status !== "PENDING") throw new BookingLifecycleError("Only pending bookings can be rejected.");
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "REJECTED", rejectionReason: reason || null, canceledAt: new Date() } });
    try { await deleteGoogleCalendarEvent(booking.id); calendarSync = "updated"; } catch (error) { calendarSync = "pending"; console.error("Google Calendar rejection sync failed", error); }
    await scheduleCancellationSafely(booking.id);
  } else if (action === "cancel") {
    if (!(["PENDING", "CONFIRMED"] as string[]).includes(booking.status)) throw new BookingLifecycleError("This booking can no longer be canceled.");
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELED", cancellationReason: reason || null, canceledAt: new Date() } });
    try { await deleteGoogleCalendarEvent(booking.id); calendarSync = "updated"; } catch (error) { calendarSync = "pending"; console.error("Google Calendar cancellation sync failed", error); }
    await scheduleCancellationSafely(booking.id);
  } else {
    if (booking.status !== "CONFIRMED") throw new BookingLifecycleError("Only confirmed bookings can be marked as no-show.");
    if (booking.startAt > new Date()) throw new BookingLifecycleError("A future booking cannot be marked as no-show.");
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "NO_SHOW" } });
  }

  const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, select: { id: true, uid: true, status: true } });
  return { ...updated, calendarSync };
}

export async function cancelBookingByUid(uid: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { uid }, select: { id: true, status: true, startAt: true } });
  if (!booking) throw new BookingLifecycleError("Booking not found.");
  if (!(["PENDING", "CONFIRMED"] as string[]).includes(booking.status)) throw new BookingLifecycleError("This booking can no longer be canceled.");
  if (booking.startAt <= new Date()) throw new BookingLifecycleError("Past bookings cannot be canceled.");

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELED", cancellationReason: reason || "Canceled by invitee", canceledAt: new Date() },
  });
  let calendarSync: "updated" | "pending" = "updated";
  try { await deleteGoogleCalendarEvent(booking.id); } catch (error) { calendarSync = "pending"; console.error("Google Calendar invitee cancellation sync failed", error); }
  await scheduleCancellationSafely(booking.id);
  return { uid, status: "CANCELED" as const, calendarSync };
}

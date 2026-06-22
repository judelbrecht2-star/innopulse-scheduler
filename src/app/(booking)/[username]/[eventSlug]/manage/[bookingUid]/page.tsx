import { formatInTimeZone } from "date-fns-tz";
import { CalendarCheck2, Clock3, Globe2, Mail, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { ManageBookingActions } from "@/components/booking/manage-booking-actions";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ManageBookingPage({ params }: { params: Promise<{ username: string; eventSlug: string; bookingUid: string }> }) {
  const { username, eventSlug, bookingUid } = await params;
  const booking = await prisma.booking.findFirst({
    where: { uid: bookingUid, eventType: { slug: eventSlug, owner: { username } } },
    include: { eventType: { include: { owner: true } }, calendarEvent: true },
  });
  if (!booking) notFound();
  const active = (["PENDING", "CONFIRMED"] as string[]).includes(booking.status) && booking.startAt > new Date();
  const timeZone = booking.inviteeTimeZone;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <div className="mb-8 flex justify-center"><BrandMark /></div>
      <Card><CardContent className="p-7 md:p-9">
        <p className="ip-eyebrow">Manage booking</p><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">{booking.eventType.title}</h1><span className="rounded-pill bg-muted px-3 py-1.5 text-xs uppercase tracking-wide">{booking.status.toLowerCase()}</span></div>
        <div className="mt-7 space-y-3 rounded-card border bg-brand-cream-2/45 p-5 text-sm"><p className="flex items-center gap-3"><CalendarCheck2 className="size-4 text-brand-green" />{formatInTimeZone(booking.startAt, timeZone, "EEEE, d MMMM yyyy")}</p><p className="flex items-center gap-3"><Clock3 className="size-4 text-brand-green" />{formatInTimeZone(booking.startAt, timeZone, "h:mm a")}–{formatInTimeZone(booking.endAt, timeZone, "h:mm a")}</p><p className="flex items-center gap-3"><Globe2 className="size-4 text-brand-green" />{timeZone}</p><p className="flex items-center gap-3"><UserRound className="size-4 text-brand-green" />{booking.inviteeName}</p><p className="flex items-center gap-3"><Mail className="size-4 text-brand-green" />{booking.inviteeEmail}</p></div>
        {active ? <ManageBookingActions bookingUid={booking.uid} rescheduleHref={`/${username}/${eventSlug}?reschedule=${booking.uid}`} /> : <p className="mt-7 rounded-button bg-muted p-4 text-sm text-muted-foreground">This booking can no longer be changed.</p>}
      </CardContent></Card>
    </main>
  );
}

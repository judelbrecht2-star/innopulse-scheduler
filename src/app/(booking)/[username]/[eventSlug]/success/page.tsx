import { formatInTimeZone } from "date-fns-tz";
import { CalendarCheck2, Clock3, Globe2, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  params: Promise<{ username: string; eventSlug: string }>;
  searchParams: Promise<{ booking?: string }>;
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { username, eventSlug } = await params;
  const { booking: uid } = await searchParams;
  if (!uid) notFound();

  const booking = await prisma.booking.findFirst({
    where: {
      uid,
      eventType: { slug: eventSlug, owner: { username } },
    },
    include: { eventType: { include: { owner: true } }, calendarEvent: true },
  });
  if (!booking) notFound();

  const timeZone = booking.inviteeTimeZone;
  const dateLabel = formatInTimeZone(booking.startAt, timeZone, "EEEE, d MMMM yyyy");
  const timeLabel = `${formatInTimeZone(booking.startAt, timeZone, "h:mm a")}–${formatInTimeZone(booking.endAt, timeZone, "h:mm a")}`;
  const agendaItems = booking.eventType.meetingAgenda.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <div className="mb-8 flex justify-center"><BrandMark /></div>
      <Card>
        <CardContent className="p-8 text-center md:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-primary">
            <CalendarCheck2 className="size-7" />
          </span>
          <p className="ip-eyebrow mt-6">{booking.rescheduledFromId ? "Booking rescheduled" : booking.status === "PENDING" ? "Request received" : "Booking confirmed"}</p>
          <h1 className="mt-2 text-3xl">You’re scheduled.</h1>
          <p className="mt-3 text-muted-foreground">
            {booking.eventType.title} with {booking.eventType.owner.name ?? "the InnoPulse team"}
          </p>

          <div className="mx-auto mt-8 max-w-md space-y-3 rounded-card border bg-brand-cream-2/45 p-5 text-left text-sm">
            <p className="flex items-center gap-3"><CalendarCheck2 className="size-4 text-brand-green" />{dateLabel}</p>
            <p className="flex items-center gap-3"><Clock3 className="size-4 text-brand-green" />{timeLabel}</p>
            <p className="flex items-center gap-3"><Globe2 className="size-4 text-brand-green" />{timeZone.replaceAll("_", " ")}</p>
            <p className="flex items-center gap-3"><Video className="size-4 text-brand-green" />{booking.calendarEvent?.conferenceUrl ? <a className="font-medium text-brand-green hover:text-brand-navy" href={booking.calendarEvent.conferenceUrl} target="_blank" rel="noreferrer">Join Google Meet</a> : "Google Meet details are being prepared."}</p>
          </div>

          <p className="mt-7 text-sm leading-6 text-muted-foreground">
            {booking.confirmationEmailSentAt ? "A confirmation email and calendar invitation have been sent to your email address." : booking.calendarEvent ? "A Google Calendar invitation has been sent to your email address." : "Your booking is confirmed. Calendar details will follow shortly."}
          </p>
          {booking.calendarEvent && <p className="mt-3 rounded-button bg-primary/15 p-4 text-sm text-brand-navy"><strong>Please accept the Google Calendar invitation</strong> to confirm your attendance.</p>}
          {agendaItems.length > 0 && <div className="mt-6 rounded-card border p-5 text-left"><h2 className="text-lg">What to expect</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{agendaItems.map((item) => <li key={item} className="flex gap-2"><span className="text-brand-green">•</span>{item}</li>)}</ul></div>}
          {booking.eventType.homeworkCtaUrl && booking.eventType.homeworkCtaLabel && <Button asChild className="mt-6"><a href={booking.eventType.homeworkCtaUrl} target="_blank" rel="noreferrer">{booking.eventType.homeworkCtaLabel}</a></Button>}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline"><Link href={`/${username}/${eventSlug}/manage/${booking.uid}`}>Manage booking</Link></Button>
            <Button asChild variant="ghost"><Link href={`/${username}/${eventSlug}`}>Book another time</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

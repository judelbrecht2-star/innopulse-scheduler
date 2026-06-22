import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Clock3, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { BookingActions } from "@/components/dashboard/booking-actions";
import { MeetLinkAction } from "@/components/dashboard/meet-link-action";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

const tabs = [{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "canceled", label: "Canceled" }] as const;

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireHost();
  if (!user) return null;
  const requested = (await searchParams).view;
  const view = tabs.some((tab) => tab.value === requested) ? requested as (typeof tabs)[number]["value"] : "upcoming";
  const now = new Date();
  const where: Prisma.BookingWhereInput = view === "canceled"
    ? { hostId: user.id, status: { in: ["CANCELED", "REJECTED", "RESCHEDULED"] } }
    : view === "past"
      ? { hostId: user.id, startAt: { lt: now }, status: { in: ["CONFIRMED", "PENDING", "NO_SHOW"] } }
      : { hostId: user.id, startAt: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] } };
  const bookings = await prisma.booking.findMany({ where, orderBy: { startAt: view === "past" ? "desc" : "asc" }, include: { eventType: { select: { title: true } }, answers: true, calendarEvent: true } });

  return (
    <main className="p-5 md:p-8 lg:p-9">
      <p className="ip-eyebrow">Bookings</p><h1>Meeting pipeline.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Review every scheduled conversation from one place.</p>
      <nav className="mt-7 inline-flex gap-1 rounded-pill border border-black/[0.06] bg-[#eef0eb] p-1" aria-label="Booking views">{tabs.map((tab) => <Link key={tab.value} href={`/dashboard/bookings?view=${tab.value}`} aria-current={view === tab.value ? "page" : undefined} className={cn("rounded-pill px-4 py-2.5 text-sm font-medium transition-colors", view === tab.value ? "bg-[#151613] text-white shadow-[0_8px_18px_rgba(21,22,19,.15)]" : "text-muted-foreground hover:bg-white hover:text-foreground")}>{tab.label}</Link>)}</nav>
      <section className="mt-6 space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[180px_1fr_auto] lg:items-center">
              <div className="rounded-[18px] bg-[#eef0eb] p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-green">{formatInTimeZone(booking.startAt, user.timeZone, "EEE, d MMM yyyy")}</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{formatInTimeZone(booking.startAt, user.timeZone, "h:mm a")}</p><p className="mt-1 text-xs text-muted-foreground">until {formatInTimeZone(booking.endAt, user.timeZone, "h:mm a")}</p></div>
              <div className="lg:border-l lg:border-black/[0.07] lg:pl-6"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{booking.eventType.title}</h2><span className={cn("rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", booking.status === "CONFIRMED" ? "bg-[#151613] text-primary" : "bg-muted text-muted-foreground")}>{booking.status.toLowerCase()}</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><UserRound className="size-4" />{booking.inviteeName}</span><a className="inline-flex items-center gap-2 hover:text-foreground" href={`mailto:${booking.inviteeEmail}`}><Mail className="size-4" />{booking.inviteeEmail}</a><span className="inline-flex items-center gap-2"><Clock3 className="size-4" />{booking.inviteeTimeZone}</span></div>{booking.answers.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{booking.answers.length} intake answer{booking.answers.length === 1 ? "" : "s"}</p>}</div>
              <div className="space-y-3 text-sm text-muted-foreground lg:text-right"><MeetLinkAction bookingId={booking.id} meetUrl={booking.calendarEvent?.conferenceUrl ?? (booking.location?.startsWith("https://meet.google.com/") ? booking.location : null)} canCreate={view === "upcoming" && booking.status === "CONFIRMED"} /><p>Created<br />{formatInTimeZone(booking.createdAt, user.timeZone, "d MMM")}</p><BookingActions bookingId={booking.id} status={booking.status} isPast={booking.startAt < now} /></div>
            </CardContent>
          </Card>
        ))}
        {bookings.length === 0 && <Card className="border-dashed shadow-none"><CardContent className="py-14 text-center"><CalendarDays className="mx-auto size-8 text-brand-green" /><h2 className="mt-4 text-xl">No {view} bookings</h2><p className="mt-2 text-sm text-muted-foreground">Meetings will appear here as your schedule changes.</p></CardContent></Card>}
      </section>
    </main>
  );
}

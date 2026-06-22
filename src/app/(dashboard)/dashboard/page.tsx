import { formatInTimeZone } from "date-fns-tz";
import { ArrowUpRight, CalendarCheck2, CalendarRange, Check, Clock3, Settings2, UsersRound, Zap } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function DashboardPage() {
  const user = await requireHost();
  if (!user) return null;
  const now = new Date();
  const [eventTypeCount, upcomingCount, bookingCount, nextBooking, schedule, calendarConnection] = await Promise.all([
    prisma.eventType.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    prisma.booking.count({ where: { hostId: user.id, startAt: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] } } }),
    prisma.booking.count({ where: { hostId: user.id } }),
    prisma.booking.findFirst({ where: { hostId: user.id, startAt: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] } }, orderBy: { startAt: "asc" }, include: { eventType: { select: { title: true } } } }),
    prisma.schedule.findFirst({ where: { ownerId: user.id, isDefault: true }, select: { _count: { select: { availabilityRules: true } } } }),
    prisma.calendarConnection.findFirst({ where: { userId: user.id, provider: "GOOGLE" }, select: { status: true } }),
  ]);

  const statusItems = [
    { label: "Active event types", value: eventTypeCount, icon: CalendarRange, href: "/dashboard/event-types", note: "Public booking offers" },
    { label: "Upcoming meetings", value: upcomingCount, icon: CalendarCheck2, href: "/dashboard/bookings", note: "Confirmed and pending" },
    { label: "Total bookings", value: bookingCount, icon: UsersRound, href: "/dashboard/bookings?view=past", note: "Lifetime conversations" },
  ];
  const readiness = [
    { label: "Booking page", ready: eventTypeCount > 0 },
    { label: "Working hours", ready: Boolean(schedule?._count.availabilityRules) },
    { label: "Google Calendar", ready: calendarConnection?.status === "ACTIVE" },
  ];
  const readinessScore = readiness.filter((item) => item.ready).length;

  return (
    <main className="p-5 md:p-8 lg:p-9">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="ip-eyebrow">Live operations</p>
          <h1>Scheduling dashboard.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">A focused view of your booking demand, availability health, and next client conversation.</p>
        </div>
        <Link href="/dashboard/event-types/new" className="inline-flex w-fit items-center gap-2 rounded-pill bg-[#151613] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
          Create event type <ArrowUpRight className="size-4 text-primary" />
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {statusItems.map(({ label, value, icon: Icon, href, note }, index) => (
          <Link key={label} href={href} className="group">
            <Card className="h-full overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-[16px] bg-[#eef0eb] text-[#151613] transition-colors group-hover:bg-primary"><Icon className="size-5" /></span>
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">0{index + 1}</span>
                </div>
                <p className="mt-7 text-sm text-muted-foreground">{label}</p>
                <div className="mt-1 flex items-end justify-between gap-3"><p className="text-4xl font-semibold tracking-[-0.06em]">{value}</p><ArrowUpRight className="mb-1 size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
                <p className="mt-3 text-xs text-muted-foreground">{note}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
        <Card className="dashboard-panel-dark overflow-hidden">
          <CardContent className="grid min-h-[280px] gap-8 p-7 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45"><span className="size-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(200,255,71,.14)]" />Next meeting</div>
              {nextBooking ? (
                <>
                  <p className="mt-9 max-w-xl text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.96] tracking-[-0.055em]">{nextBooking.eventType.title}</p>
                  <p className="mt-4 text-sm text-white/55">with {nextBooking.inviteeName}</p>
                </>
              ) : (
                <><p className="mt-9 text-4xl font-semibold tracking-[-0.05em]">Your calendar is clear.</p><p className="mt-4 text-sm text-white/55">Share a booking link to start the next conversation.</p></>
              )}
            </div>
            <div className="md:text-right">
              {nextBooking && <><p className="text-5xl font-semibold tracking-[-0.06em] text-primary">{formatInTimeZone(nextBooking.startAt, user.timeZone, "HH:mm")}</p><p className="mt-2 text-sm text-white/55">{formatInTimeZone(nextBooking.startAt, user.timeZone, "EEE, d MMM")}</p></>}
              <Link href="/dashboard/bookings" className="mt-7 inline-flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-xs font-semibold text-[#151613]">View pipeline <ArrowUpRight className="size-3.5" /></Link>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel-lime overflow-hidden">
          <CardContent className="flex min-h-[280px] flex-col p-7">
            <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">System readiness</p><Settings2 className="size-5" /></div>
            <p className="mt-7 text-6xl font-semibold tracking-[-0.07em]">{readinessScore}/3</p>
            <div className="mt-auto space-y-3 pt-7">
              {readiness.map((item) => <div key={item.label} className="flex items-center justify-between border-t border-black/10 pt-3 text-sm"><span>{item.label}</span><span className={`flex size-6 items-center justify-center rounded-full ${item.ready ? "bg-[#151613] text-primary" : "border border-black/25"}`}>{item.ready && <Check className="size-3.5" />}</span></div>)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Shape availability", description: "Set weekly hours and exceptions.", href: "/dashboard/availability", icon: Clock3 },
          { label: "Automate follow-up", description: "Build reminders and client emails.", href: "/dashboard/workflows", icon: Zap },
          { label: "Tune your workspace", description: "Manage profile, calendars and timezone.", href: "/dashboard/settings", icon: Settings2 },
        ].map(({ label, description, href, icon: Icon }) => <Link key={label} href={href} className="group flex items-center gap-4 rounded-[22px] border border-black/[0.07] bg-white p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(29,32,27,.08)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#151613] text-primary"><Icon className="size-4" /></span><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span></Link>)}
      </section>
    </main>
  );
}

import { CalendarRange, Clock3, ExternalLink, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyBookingLinkButton } from "@/components/dashboard/copy-booking-link-button";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function EventTypesPage() {
  const user = await requireHost();
  if (!user) return null;
  const eventTypes = await prisma.eventType.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "asc" }, include: { _count: { select: { bookings: true, hosts: true } } } });

  return (
    <main className="p-5 md:p-8 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="ip-eyebrow">Event types</p><h1>Booking experiences.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Design each meeting around its purpose, audience, and delivery rules.</p></div><Button asChild><Link href="/dashboard/event-types/new"><Plus className="size-4" /> New event type</Link></Button></div>
      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        {eventTypes.map((eventType) => (
          <Card key={eventType.id} className="group overflow-hidden hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[0_18px_44px_rgba(29,32,27,.09)]">
            <div className="h-2 bg-primary transition-[width] group-hover:w-full" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4"><div><span className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${eventType.status === "ACTIVE" ? "bg-[#151613] text-primary" : "bg-muted text-muted-foreground"}`}>{eventType.status.toLowerCase()}</span><h2 className="mt-4 text-2xl font-semibold">{eventType.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{eventType.description || "No description added."}</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[#eef0eb] text-[#151613] transition-colors group-hover:bg-primary"><CalendarRange className="size-5" /></span></div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Clock3 className="size-4" />{eventType.durationMinutes} min</span><span>{eventType._count.bookings} booking{eventType._count.bookings === 1 ? "" : "s"}</span><span>{eventType.schedulingType.replaceAll("_", " ").toLowerCase()} · {eventType._count.hosts} host{eventType._count.hosts === 1 ? "" : "s"}</span></div>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-black/[0.07] pt-5"><Button asChild variant="outline" size="sm"><Link href={`/dashboard/event-types/${eventType.id}`}><Settings2 className="size-4" /> Edit</Link></Button>{eventType.status === "ACTIVE" && user.username && <><CopyBookingLinkButton username={user.username} slug={eventType.slug} /><Button asChild variant="ghost" size="sm"><Link href={`/${user.username}/${eventType.slug}`} target="_blank"><ExternalLink className="size-4" /> Open booking page</Link></Button></>}</div>
            </CardContent>
          </Card>
        ))}
        {eventTypes.length === 0 && <Card className="border-dashed shadow-none xl:col-span-2"><CardContent className="py-12 text-center"><CalendarRange className="mx-auto size-8 text-brand-green" /><h2 className="mt-4 text-xl">Create your first event type</h2><p className="mt-2 text-sm text-muted-foreground">Choose a duration, booking rules, and invitee questions.</p></CardContent></Card>}
      </section>
    </main>
  );
}

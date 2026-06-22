import type { Metadata } from "next";
import { CalendarRange, Clock3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function findPublicProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: { ownedEventTypes: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { title: true, slug: true, description: true, durationMinutes: true, locationType: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await findPublicProfile(username);
  if (!user) return { title: "Host unavailable" };
  return {
    title: `Schedule with ${user.name ?? username}`,
    description: user.bio ?? `Choose a meeting with ${user.name ?? username}.`,
    robots: user.allowSearchEngineIndexing ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await findPublicProfile(username);
  if (!user) notFound();
  const initials = (user.name ?? username).split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-16 pt-6">
      <header className="mb-8"><BrandMark /></header>
      <Card className="overflow-hidden"><div className="h-2 bg-primary" /><CardContent className="p-6 md:p-9">
        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center">
          {user.image ? <div className="size-20 shrink-0 rounded-full bg-cover bg-center shadow-card" style={{ backgroundImage: `url(${user.image})` }} role="img" aria-label={`${user.name ?? username} profile`} /> : <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-navy text-2xl font-semibold text-white">{initials}</span>}
          <div><p className="ip-eyebrow">Schedule a conversation</p><h1 className="text-3xl">{user.name ?? username}</h1>{user.bio && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{user.bio}</p>}</div>
        </div>
        <section className="mt-7 space-y-4">
          {user.ownedEventTypes.map((eventType) => <article key={eventType.slug} className="group flex flex-col justify-between gap-5 rounded-panel border p-5 transition-colors hover:border-brand-green sm:flex-row sm:items-center"><div><h2 className="text-xl">{eventType.title}</h2>{eventType.description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{eventType.description}</p>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-brand-green" />{eventType.durationMinutes} minutes</span><span className="inline-flex items-center gap-1.5"><CalendarRange className="size-3.5 text-brand-green" />{eventType.locationType === "GOOGLE_MEET" ? "Google Meet" : eventType.locationType.replaceAll("_", " ").toLowerCase()}</span></div></div><Button asChild size="sm"><Link href={`/${username}/${eventType.slug}`}>View times</Link></Button></article>)}
          {user.ownedEventTypes.length === 0 && <div className="rounded-panel border border-dashed p-10 text-center"><CalendarRange className="mx-auto size-7 text-brand-green" /><p className="mt-3 font-medium">No meetings available</p><p className="mt-1 text-sm text-muted-foreground">This host has not published any event types yet.</p></div>}
        </section>
      </CardContent></Card>
    </main>
  );
}

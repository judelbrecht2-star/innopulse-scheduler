import { ArrowRight, Route } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicRoutingPage({ params }: { params: Promise<{ username: string; routingSlug: string }> }) {
  const { username, routingSlug } = await params;
  const form = await prisma.routingForm.findFirst({ where: { slug: routingSlug, status: "ACTIVE", owner: { username } }, include: { owner: true } });
  if (!form) notFound();
  const question = form.question && typeof form.question === "object" && !Array.isArray(form.question) ? form.question as { label?: string; options?: unknown[] } : {};
  const routes = form.routes && typeof form.routes === "object" && !Array.isArray(form.routes) ? form.routes as Record<string, unknown> : {};
  const eventTypeIds = Object.values(routes).filter((value): value is string => typeof value === "string");
  const eventTypes = await prisma.eventType.findMany({ where: { id: { in: eventTypeIds }, status: "ACTIVE" }, select: { id: true, slug: true } });
  const slugById = new Map(eventTypes.map((eventType) => [eventType.id, eventType.slug]));
  const options = (Array.isArray(question.options) ? question.options : []).filter((option): option is string => typeof option === "string").map((label) => ({ label, slug: typeof routes[label] === "string" ? slugById.get(routes[label] as string) : undefined })).filter((option): option is { label: string; slug: string } => Boolean(option.slug));

  return <main className="mx-auto min-h-screen max-w-2xl px-5 py-8"><div className="mb-8 flex justify-center"><BrandMark /></div><Card><CardContent className="p-7 md:p-10"><span className="flex size-12 items-center justify-center rounded-button bg-secondary text-secondary-foreground"><Route className="size-5" /></span><p className="ip-eyebrow mt-6">{form.name}</p><h1 className="text-3xl">{question.label || "How can we help?"}</h1><p className="mt-3 text-sm text-muted-foreground">Choose the option that best matches your needs.</p><div className="mt-7 space-y-3">{options.map((option) => <Link key={option.label} href={`/${username}/${option.slug}`} className="flex items-center justify-between rounded-panel border bg-white p-4 font-medium transition hover:border-brand-green hover:shadow-focus-lime"><span>{option.label}</span><ArrowRight className="size-4 text-brand-green" /></Link>)}</div></CardContent></Card></main>;
}

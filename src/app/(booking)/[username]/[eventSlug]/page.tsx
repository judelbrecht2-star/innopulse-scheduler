import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking/booking-flow";
import type { PublicEventType } from "@/components/booking/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface BookingPageProps {
  params: Promise<{ username: string; eventSlug: string }>;
  searchParams: Promise<{ reschedule?: string }>;
}

async function findEventType(username: string, eventSlug: string) {
  return prisma.eventType.findFirst({
    where: {
      slug: eventSlug,
      status: "ACTIVE",
      owner: { username },
    },
    include: {
      owner: true,
      schedule: true,
      hosts: {
        orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
        include: { user: true },
      },
      questions: { orderBy: { position: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { username, eventSlug } = await params;
  const eventType = await findEventType(username, eventSlug);
  if (!eventType) return { title: "Meeting unavailable" };

  return {
    title: `Book ${eventType.title}`,
    description: eventType.description ?? `Schedule ${eventType.durationMinutes} minutes with ${eventType.owner.name ?? username}.`,
  };
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { username, eventSlug } = await params;
  const { reschedule } = await searchParams;
  const eventType = await findEventType(username, eventSlug);
  if (!eventType?.schedule || !eventType.owner.username) notFound();

  if (reschedule) {
    const original = await prisma.booking.findFirst({
      where: { uid: reschedule, eventTypeId: eventType.id, status: { in: ["PENDING", "CONFIRMED"] }, startAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!original) notFound();
  }

  const host = eventType.hosts[0]?.user ?? eventType.owner;
  const publicEventType: PublicEventType = {
    id: eventType.id,
    username: eventType.owner.username,
    slug: eventType.slug,
    title: eventType.title,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    bookingWindowDays: eventType.bookingWindowDays,
    minimumNoticeMinutes: eventType.minimumNoticeMinutes,
    hostName: host.name ?? "InnoPulse Host",
    hostTimeZone: eventType.schedule.timeZone,
    locationType: eventType.locationType,
    questions: eventType.questions.map((question) => ({
      id: question.id,
      type: question.type,
      label: question.label,
      placeholder: question.placeholder,
      helpText: question.helpText,
      required: question.required,
      options: Array.isArray(question.options)
        ? question.options.filter((option): option is string => typeof option === "string")
        : [],
    })),
  };

  return <BookingFlow eventType={publicEventType} rescheduleUid={reschedule} />;
}

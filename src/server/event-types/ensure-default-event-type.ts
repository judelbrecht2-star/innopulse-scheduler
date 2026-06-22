import { prisma } from "@/lib/prisma";

export async function ensureDefaultEventType(userId: string, scheduleId: string) {
  return prisma.eventType.upsert({
    where: { ownerId_slug: { ownerId: userId, slug: "30-minute-meeting" } },
    update: { scheduleId },
    create: {
      ownerId: userId,
      scheduleId,
      title: "30 Minute Meeting",
      slug: "30-minute-meeting",
      description: "Choose a convenient time for a focused conversation with the InnoPulse team.",
      status: "ACTIVE",
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 60,
      bookingWindowDays: 60,
      locationType: "GOOGLE_MEET",
      hosts: { create: { userId, isPrimary: true } },
      questions: {
        create: {
          type: "LONG_TEXT",
          label: "What would you like to discuss?",
          placeholder: "Share any context that will help us prepare.",
          position: 0,
          required: false,
        },
      },
    },
  });
}

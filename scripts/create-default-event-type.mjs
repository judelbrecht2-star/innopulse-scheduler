import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    include: { schedules: { where: { isDefault: true }, take: 1 } },
  });
  if (!user?.username || !user.schedules[0]) throw new Error("A provisioned host and default schedule are required.");

  const eventType = await prisma.eventType.upsert({
    where: { ownerId_slug: { ownerId: user.id, slug: "30-minute-meeting" } },
    update: { scheduleId: user.schedules[0].id, status: "ACTIVE" },
    create: {
      ownerId: user.id,
      scheduleId: user.schedules[0].id,
      title: "30 Minute Meeting",
      slug: "30-minute-meeting",
      description: "Choose a convenient time for a focused conversation with the InnoPulse team.",
      status: "ACTIVE",
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 60,
      bookingWindowDays: 60,
      locationType: "GOOGLE_MEET",
      hosts: { create: { userId: user.id, isPrimary: true } },
      questions: {
        create: {
          type: "LONG_TEXT",
          label: "What would you like to discuss?",
          placeholder: "Share any context that will help us prepare.",
          position: 0,
        },
      },
    },
  });

  console.info(JSON.stringify({ publicPath: `/${user.username}/${eventType.slug}` }));
} finally {
  await prisma.$disconnect();
}

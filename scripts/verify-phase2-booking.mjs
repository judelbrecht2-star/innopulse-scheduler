import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const booking = await prisma.booking.findFirst({
    where: {
      inviteeEmail: "phase2-test@example.com",
      eventType: { slug: "30-minute-meeting" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      uid: true,
      status: true,
      startAt: true,
      endAt: true,
      inviteeTimeZone: true,
      answers: { select: { id: true } },
    },
  });

  console.info(
    JSON.stringify(
      booking
        ? {
            found: true,
            uid: booking.uid,
            status: booking.status,
            start: booking.startAt.toISOString(),
            end: booking.endAt.toISOString(),
            timeZone: booking.inviteeTimeZone,
            answerCount: booking.answers.length,
          }
        : { found: false },
    ),
  );
} finally {
  await prisma.$disconnect();
}

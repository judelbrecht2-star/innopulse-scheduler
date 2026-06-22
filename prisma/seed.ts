import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_HOST_EMAIL || "host@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "InnoPulse Host",
      username: "innopulse-host",
      timeZone: "Africa/Johannesburg",
      locale: "en-ZA",
    },
  });

  const schedule = await prisma.schedule.upsert({
    where: { ownerId_name: { ownerId: user.id, name: "Working hours" } },
    update: {},
    create: {
      ownerId: user.id,
      name: "Working hours",
      timeZone: "Africa/Johannesburg",
      isDefault: true,
      availabilityRules: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: new Date("1970-01-01T09:00:00.000Z"),
          endTime: new Date("1970-01-01T17:00:00.000Z"),
        })),
      },
    },
  });

  const eventType = await prisma.eventType.upsert({
    where: { ownerId_slug: { ownerId: user.id, slug: "innovation-consultation" } },
    update: {},
    create: {
      ownerId: user.id,
      scheduleId: schedule.id,
      title: "Innovation Consultation",
      slug: "innovation-consultation",
      description: "A focused conversation about your organisation's innovation capability.",
      durationMinutes: 30,
      status: "ACTIVE",
      locationType: "GOOGLE_MEET",
      hosts: { create: { userId: user.id, isPrimary: true } },
      questions: {
        create: {
          type: "LONG_TEXT",
          label: "What would you like to discuss?",
          position: 0,
          required: false,
        },
      },
    },
  });

  console.info(`Seeded ${email}: /${user.username}/${eventType.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

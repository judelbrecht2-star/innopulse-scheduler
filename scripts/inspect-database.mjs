import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  const constraints = await prisma.$queryRaw`
    SELECT conname
    FROM pg_constraint
    WHERE conname IN (
      'AvailabilityRule_valid_day',
      'AvailabilityRule_valid_range',
      'AvailabilityOverride_valid_range',
      'Booking_valid_range',
      'Booking_host_no_overlap'
    )
    ORDER BY conname
  `;

  const extensions = await prisma.$queryRaw`
    SELECT extname
    FROM pg_extension
    WHERE extname = 'btree_gist'
  `;

  console.info(
    JSON.stringify({
      tableCount: tables.length,
      tables: tables.map(({ table_name }) => table_name),
      constraints: constraints.map(({ conname }) => conname),
      btreeGistEnabled: extensions.length === 1,
    }),
  );
} finally {
  await prisma.$disconnect();
}

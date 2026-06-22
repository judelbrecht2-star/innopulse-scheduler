import { AvailabilityEditor } from "@/components/dashboard/availability-editor";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

function timeValue(date: Date | null) { return date ? date.toISOString().slice(11, 16) : null; }

export default async function AvailabilityPage() {
  const user = await requireHost();
  if (!user) return null;
  const schedule = await prisma.schedule.findFirst({ where: { ownerId: user.id, isDefault: true }, include: { availabilityRules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }, overrides: { orderBy: { date: "asc" } } } });
  if (!schedule) return null;
  return <AvailabilityEditor timeZone={schedule.timeZone} initialRules={schedule.availabilityRules.map((rule) => ({ dayOfWeek: rule.dayOfWeek, startTime: timeValue(rule.startTime)!, endTime: timeValue(rule.endTime)! }))} initialOverrides={schedule.overrides.map((override) => ({ date: override.date.toISOString().slice(0, 10), type: override.type, startTime: timeValue(override.startTime), endTime: timeValue(override.endTime), note: override.note ?? "" }))} />;
}

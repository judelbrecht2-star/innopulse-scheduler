import { OutOfOfficeManager } from "@/components/dashboard/out-of-office-manager";
import { SettingsPageHeader } from "@/components/dashboard/settings-page-header";
import { prisma } from "@/lib/prisma";
import { groupOutOfOfficeOverrides } from "@/server/availability/out-of-office";
import { requireHost } from "@/server/dashboard/require-host";

export default async function OutOfOfficePage() {
  const user = await requireHost();
  if (!user) return null;
  const schedule = await prisma.schedule.findFirst({
    where: { ownerId: user.id, isDefault: true },
    include: { overrides: { where: { type: "UNAVAILABLE" }, orderBy: { date: "asc" }, select: { date: true, note: true } } },
  });
  if (!schedule) return null;

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <SettingsPageHeader eyebrow="Personal settings" title="Out of office" description="Block a single date or a longer period. Invitees will never see bookable times while you are away." />
      <OutOfOfficeManager initialPeriods={groupOutOfOfficeOverrides(schedule.overrides)} timeZone={schedule.timeZone} />
    </main>
  );
}

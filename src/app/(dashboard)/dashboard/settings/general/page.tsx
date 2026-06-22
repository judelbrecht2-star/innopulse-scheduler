import { GeneralSettingsForm } from "@/components/dashboard/general-settings-form";
import { SettingsPageHeader } from "@/components/dashboard/settings-page-header";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function GeneralSettingsPage() {
  const sessionUser = await requireHost();
  if (!sessionUser) return null;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { locale: true, timeZone: true, timeFormat: true, weekStart: true } });

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <SettingsPageHeader eyebrow="Personal settings" title="General preferences" description="Choose how dates and times are managed across your dashboard and scheduling engine." />
      <GeneralSettingsForm initialSettings={{ locale: user.locale as "en-ZA" | "en-GB" | "en-US", timeZone: user.timeZone, timeFormat: user.timeFormat, weekStart: user.weekStart }} />
    </main>
  );
}

import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { SettingsPageHeader } from "@/components/dashboard/settings-page-header";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function ProfileSettingsPage() {
  const sessionUser = await requireHost();
  if (!sessionUser) return null;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: { ownedEventTypes: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { title: true, durationMinutes: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <SettingsPageHeader eyebrow="Personal settings" title="Public profile" description="Shape how hosts and event types are presented before an invitee books." />
      <ProfileSettingsForm initialProfile={{ name: user.name ?? "", username: user.username ?? "", bio: user.bio ?? "", image: user.image ?? "", allowSearchEngineIndexing: user.allowSearchEngineIndexing }} eventTypes={user.ownedEventTypes} />
    </main>
  );
}

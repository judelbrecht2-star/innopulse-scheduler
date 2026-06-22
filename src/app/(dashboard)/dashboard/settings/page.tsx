import { SettingsHub } from "@/components/dashboard/settings-hub";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-6xl p-5 pb-24 md:p-8 lg:p-9">
      <p className="ip-eyebrow">Settings</p>
      <h1 className="text-3xl">Control centre.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Manage your public profile, scheduling preferences, calendar connections, and automation tools.</p>
      <SettingsHub />
    </main>
  );
}

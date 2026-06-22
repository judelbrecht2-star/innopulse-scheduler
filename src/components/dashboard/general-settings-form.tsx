"use client";

import { Save } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GeneralState = { locale: "en-ZA" | "en-GB" | "en-US"; timeZone: string; timeFormat: "TWELVE_HOUR" | "TWENTY_FOUR_HOUR"; weekStart: number };

const commonTimeZones = ["Africa/Johannesburg", "Africa/Harare", "Africa/Nairobi", "Europe/London", "Europe/Amsterdam", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"];

export function GeneralSettingsForm({ initialSettings }: { initialSettings: GeneralState }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const timeZones = commonTimeZones.includes(settings.timeZone) ? commonTimeZones : [settings.timeZone, ...commonTimeZones];

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/settings/general", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save preferences.");
      setMessage({ type: "success", text: "Preferences saved. Availability now uses your selected timezone." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save preferences." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-8 max-w-3xl">
      <CardContent className="space-y-6 p-6 md:p-8">
        {message && <p role="status" className={`rounded-button p-4 text-sm ${message.type === "success" ? "bg-primary/20 text-brand-navy" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}
        <div><label className="mb-2 block text-sm font-medium" htmlFor="language">Language</label><select id="language" className="ip-input" value={settings.locale} onChange={(event) => setSettings({ ...settings, locale: event.target.value as GeneralState["locale"] })}><option value="en-ZA">English (South Africa)</option><option value="en-GB">English (United Kingdom)</option><option value="en-US">English (United States)</option></select></div>
        <div><label className="mb-2 block text-sm font-medium" htmlFor="timezone">Timezone</label><select id="timezone" className="ip-input" value={settings.timeZone} onChange={(event) => setSettings({ ...settings, timeZone: event.target.value })}>{timeZones.map((timeZone) => <option key={timeZone} value={timeZone}>{timeZone.replaceAll("_", " ")}</option>)}</select><p className="mt-2 text-xs leading-5 text-muted-foreground">Changing this updates the timezone used by your working hours and booking engine.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium" htmlFor="time-format">Time format</label><select id="time-format" className="ip-input" value={settings.timeFormat} onChange={(event) => setSettings({ ...settings, timeFormat: event.target.value as GeneralState["timeFormat"] })}><option value="TWELVE_HOUR">12-hour (2:30 PM)</option><option value="TWENTY_FOUR_HOUR">24-hour (14:30)</option></select></div>
          <div><label className="mb-2 block text-sm font-medium" htmlFor="week-start">Start of week</label><select id="week-start" className="ip-input" value={settings.weekStart} onChange={(event) => setSettings({ ...settings, weekStart: Number(event.target.value) })}><option value={1}>Monday</option><option value={0}>Sunday</option><option value={6}>Saturday</option></select></div>
        </div>
        <div className="border-t pt-6"><Button type="button" onClick={save} disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save preferences"}</Button></div>
      </CardContent>
    </Card>
  );
}

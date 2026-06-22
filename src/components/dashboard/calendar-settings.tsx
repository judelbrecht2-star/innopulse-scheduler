"use client";

import { CalendarCheck2, CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Calendar = {
  id: string;
  name: string;
  timeZone: string | null;
  isPrimary: boolean;
  isConflictCalendar: boolean;
  isDestination: boolean;
  readOnly: boolean;
};

export function CalendarSettings({
  providerEmail,
  status,
  lastSyncedLabel,
  calendars,
}: {
  providerEmail: string;
  status: "ACTIVE" | "REAUTH_REQUIRED" | "ERROR";
  lastSyncedLabel: string | null;
  calendars: Calendar[];
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/calendars/google/sync", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sync Google calendars.");
      setMessage(`Synced ${result.calendars.length} Google calendar${result.calendars.length === 1 ? "" : "s"}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sync Google calendars.");
    } finally {
      setSyncing(false);
    }
  }

  async function updateCalendar(calendarId: string, patch: { isConflictCalendar?: boolean; isDestination?: boolean }) {
    setSavingId(calendarId);
    setMessage(null);
    try {
      const response = await fetch(`/api/dashboard/calendars/${calendarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update this calendar.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update this calendar.");
    } finally {
      setSavingId(null);
    }
  }

  const connected = status === "ACTIVE";
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-button bg-muted text-brand-green"><CalendarCheck2 className="size-6" /></span>
            <div><div className="flex items-center gap-2"><h2 className="text-xl">Google Calendar</h2>{connected ? <CheckCircle2 className="size-4 text-brand-green" /> : <CircleAlert className="size-4 text-destructive" />}</div><p className="mt-1 text-sm text-muted-foreground">{providerEmail}</p><p className="mt-2 text-xs text-muted-foreground">{lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : "Ready for the first calendar sync"}</p></div>
          </div>
          <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={sync} disabled={syncing}><RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing…" : "Sync calendars"}</Button>{!connected && <Button asChild><Link href="/api/auth/signin/google?callbackUrl=/dashboard/settings/calendars">Reconnect Google</Link></Button>}</div>
        </CardContent>
      </Card>

      {message && <p role="status" className="rounded-button bg-primary/20 p-4 text-sm text-brand-navy">{message}</p>}

      <Card>
        <CardHeader><CardTitle>Calendar routing</CardTitle><p className="mt-1 text-sm text-muted-foreground">Choose which calendars block availability and where new bookings are created.</p></CardHeader>
        <CardContent className="space-y-3">
          {calendars.length === 0 && <p className="rounded-button border border-dashed p-5 text-sm text-muted-foreground">Sync Google Calendar to load your calendar list.</p>}
          {calendars.map((calendar) => (
            <div key={calendar.id} className="grid gap-4 rounded-panel border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div><p className="font-medium">{calendar.name} {calendar.isPrimary && <span className="ml-1 text-xs text-brand-green">Primary</span>}</p><p className="mt-1 text-xs text-muted-foreground">{calendar.timeZone || "Google Calendar timezone"}{calendar.readOnly ? " · Read only" : ""}</p></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-brand-navy" checked={calendar.isConflictCalendar} disabled={savingId === calendar.id} onChange={(event) => updateCalendar(calendar.id, { isConflictCalendar: event.target.checked })} />Check for conflicts</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="destination-calendar" className="size-4 accent-brand-navy" checked={calendar.isDestination} disabled={calendar.readOnly || savingId === calendar.id} onChange={() => updateCalendar(calendar.id, { isDestination: true })} />Create bookings here</label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

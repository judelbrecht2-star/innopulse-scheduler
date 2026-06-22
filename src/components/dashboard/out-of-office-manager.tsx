"use client";

import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OutOfOfficePeriod } from "@/server/availability/out-of-office";

function friendlyDate(date: string) { return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`)); }

export function OutOfOfficeManager({ initialPeriods, timeZone }: { initialPeriods: OutOfOfficePeriod[]; timeZone: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [periods, setPeriods] = useState(initialPeriods);
  const [draft, setDraft] = useState({ startDate: today, endDate: today, note: "Out of office" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function request(method: "POST" | "DELETE", period: OutOfOfficePeriod) {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/dashboard/settings/out-of-office", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(period) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update out-of-office dates.");
      setPeriods(result.periods);
      if (method === "POST") setDraft({ startDate: today, endDate: today, note: "Out of office" });
      setMessage({ type: "success", text: method === "POST" ? "Out-of-office dates added. Those days are now blocked from booking." : "Out-of-office period removed." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update out-of-office dates." });
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit"><CardHeader><CardTitle>Add time away</CardTitle><p className="mt-1 text-sm text-muted-foreground">Dates are interpreted in {timeZone}.</p></CardHeader><CardContent className="space-y-4">
        {message && <p role="status" className={`rounded-button p-3 text-sm ${message.type === "success" ? "bg-primary/20 text-brand-navy" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}
        <div><label className="mb-2 block text-sm font-medium" htmlFor="ooo-start">Starts</label><Input id="ooo-start" type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value, endDate: current.endDate < event.target.value ? event.target.value : current.endDate }))} /></div>
        <div><label className="mb-2 block text-sm font-medium" htmlFor="ooo-end">Ends</label><Input id="ooo-end" type="date" min={draft.startDate} value={draft.endDate} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} /></div>
        <div><label className="mb-2 block text-sm font-medium" htmlFor="ooo-note">Reason</label><Input id="ooo-note" maxLength={160} placeholder="Out of office" value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} /></div>
        <Button className="w-full" type="button" disabled={saving} onClick={() => request("POST", draft)}><Plus className="size-4" />{saving ? "Saving…" : "Add time away"}</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Upcoming and saved periods</CardTitle><p className="mt-1 text-sm text-muted-foreground">Public booking slots are hidden for every date listed here.</p></CardHeader><CardContent className="space-y-3">
        {periods.length === 0 && <div className="flex min-h-44 flex-col items-center justify-center rounded-panel border border-dashed p-6 text-center"><CalendarOff className="size-7 text-brand-green" /><p className="mt-3 font-medium">No time away scheduled</p><p className="mt-1 text-sm text-muted-foreground">Add a date or range when you will not take bookings.</p></div>}
        {periods.map((period) => <div key={`${period.startDate}-${period.endDate}-${period.note}`} className="flex items-center justify-between gap-4 rounded-panel border bg-background/40 p-4"><div><p className="font-medium">{period.startDate === period.endDate ? friendlyDate(period.startDate) : `${friendlyDate(period.startDate)} – ${friendlyDate(period.endDate)}`}</p><p className="mt-1 text-sm text-muted-foreground">{period.note || "Unavailable"}</p></div><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${period.startDate} to ${period.endDate}`} disabled={saving} onClick={() => request("DELETE", period)}><Trash2 className="size-4" /></Button></div>)}
      </CardContent></Card>
    </div>
  );
}

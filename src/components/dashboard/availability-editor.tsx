"use client";

import { CalendarOff, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Rule = { dayOfWeek: number; startTime: string; endTime: string };
type Override = { date: string; type: "AVAILABLE" | "UNAVAILABLE"; startTime: string | null; endTime: string | null; note: string };

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityEditor({ timeZone, initialRules, initialOverrides }: { timeZone: string; initialRules: Rule[]; initialOverrides: Override[] }) {
  const [rules, setRules] = useState(initialRules);
  const [overrides, setOverrides] = useState(initialOverrides);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function toggleDay(dayOfWeek: number) {
    setRules((current) => current.some((rule) => rule.dayOfWeek === dayOfWeek)
      ? current.filter((rule) => rule.dayOfWeek !== dayOfWeek)
      : [...current, { dayOfWeek, startTime: "09:00", endTime: "17:00" }]);
  }

  function updateRule(dayOfWeek: number, index: number, patch: Partial<Rule>) {
    const dayRules = rules.filter((rule) => rule.dayOfWeek === dayOfWeek);
    const target = dayRules[index];
    setRules((current) => current.map((rule) => rule === target ? { ...rule, ...patch } : rule));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, overrides }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save availability.");
      setMessage({ type: "success", text: "Availability saved. Your public booking page is already using these hours." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save availability." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="ip-eyebrow">Availability</p><h1 className="text-3xl">Working hours.</h1><p className="mt-3 text-sm text-muted-foreground">All hours are managed in {timeZone}.</p></div>
        <Button type="button" onClick={save} disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save changes"}</Button>
      </div>
      {message && <p role="status" className={`mt-5 rounded-button p-4 text-sm ${message.type === "success" ? "bg-primary/20 text-brand-navy" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}

      <Card className="mt-8">
        <CardHeader><CardTitle>Weekly schedule</CardTitle><p className="mt-1 text-sm text-muted-foreground">Add more than one window when your day has a break.</p></CardHeader>
        <CardContent className="divide-y p-0">
          {days.map((day, dayOfWeek) => {
            const dayRules = rules.filter((rule) => rule.dayOfWeek === dayOfWeek);
            const enabled = dayRules.length > 0;
            return (
              <div key={day} className="grid gap-4 p-5 sm:grid-cols-[150px_1fr]">
                <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-4 accent-brand-navy" checked={enabled} onChange={() => toggleDay(dayOfWeek)} />{day}</label>
                <div className="space-y-3">
                  {!enabled && <p className="text-sm text-muted-foreground">Unavailable</p>}
                  {dayRules.map((rule, index) => (
                    <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                      <Input aria-label={`${day} start ${index + 1}`} type="time" className="w-36" value={rule.startTime} onChange={(event) => updateRule(dayOfWeek, index, { startTime: event.target.value })} />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input aria-label={`${day} end ${index + 1}`} type="time" className="w-36" value={rule.endTime} onChange={(event) => updateRule(dayOfWeek, index, { endTime: event.target.value })} />
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${day} window ${index + 1}`} onClick={() => setRules((current) => current.filter((item) => item !== rule))}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                  {enabled && <Button type="button" variant="ghost" size="sm" onClick={() => setRules((current) => [...current, { dayOfWeek, startTime: "13:00", endTime: "17:00" }])}><Plus className="size-4" /> Add hours</Button>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle>Date overrides</CardTitle><p className="mt-1 text-sm text-muted-foreground">Mark a day out of office or open special hours.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOverrides((current) => [...current, { date: "", type: "UNAVAILABLE", startTime: null, endTime: null, note: "" }])}><Plus className="size-4" /> Add date</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {overrides.length === 0 && <div className="flex items-center gap-3 rounded-button border border-dashed p-5 text-sm text-muted-foreground"><CalendarOff className="size-5 text-brand-green" />No date-specific changes.</div>}
          {overrides.map((override, index) => (
            <div key={index} className="grid gap-3 rounded-panel border bg-background/40 p-4 md:grid-cols-[150px_160px_1fr_auto]">
              <Input aria-label={`Override date ${index + 1}`} type="date" required value={override.date} onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item))} />
              <select aria-label={`Override type ${index + 1}`} className="ip-input" value={override.type} onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as Override["type"], startTime: event.target.value === "AVAILABLE" ? item.startTime ?? "09:00" : null, endTime: event.target.value === "AVAILABLE" ? item.endTime ?? "17:00" : null } : item))}><option value="UNAVAILABLE">Unavailable</option><option value="AVAILABLE">Special hours</option></select>
              <div>
                {override.type === "AVAILABLE" ? <div className="flex items-center gap-2"><Input aria-label={`Override start ${index + 1}`} type="time" value={override.startTime ?? "09:00"} onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item))} /><span className="text-sm text-muted-foreground">to</span><Input aria-label={`Override end ${index + 1}`} type="time" value={override.endTime ?? "17:00"} onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item))} /></div> : <Input aria-label={`Override note ${index + 1}`} placeholder="Out of office (optional)" value={override.note} onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} />}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove override ${index + 1}`} onClick={() => setOverrides((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

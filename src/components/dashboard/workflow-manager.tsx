"use client";

import { CheckCircle2, CircleAlert, LoaderCircle, Pause, Play, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WorkflowItem = { id: string; name: string; status: "ACTIVE" | "PAUSED"; trigger: string; offsetMinutes: number; recipient: string; eventTypeTitle: string | null; queued: number; sent: number; failed: number };
type EventTypeOption = { id: string; title: string };

export function WorkflowManager({ workflows, eventTypes, emailConfigured, cronConfigured }: { workflows: WorkflowItem[]; eventTypes: EventTypeOption[]; emailConfigured: boolean; cronConfigured: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false); const [workingId, setWorkingId] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", eventTypeId: "", status: "ACTIVE" as const, trigger: "BEFORE_START", offsetMinutes: 1440, recipient: "INVITEE", subject: "Reminder: {{event_title}}", body: "Hi {{invitee_name}},\n\nThis is a reminder that {{event_title}} starts {{start_time}}.\n\nJoin: {{meet_link}}\nManage: {{manage_url}}" });

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreating(true); setError(null);
    try {
      const response = await fetch("/api/dashboard/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, eventTypeId: form.eventTypeId || null }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to create workflow.");
      setForm((current) => ({ ...current, name: "" })); router.refresh();
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Unable to create workflow."); }
    finally { setCreating(false); }
  }

  async function toggle(workflow: WorkflowItem) {
    setWorkingId(workflow.id); setError(null);
    try {
      const response = await fetch(`/api/dashboard/workflows/${workflow.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: workflow.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to update workflow."); router.refresh();
    } catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : "Unable to update workflow."); }
    finally { setWorkingId(null); }
  }

  const triggerLabel = (workflow: WorkflowItem) => workflow.trigger === "BEFORE_START" ? `${workflow.offsetMinutes / 60} hours before` : workflow.trigger === "AFTER_END" ? `${workflow.offsetMinutes / 60} hours after` : workflow.trigger.replaceAll("_", " ").toLowerCase();
  return <main className="mx-auto max-w-6xl p-5 pb-24 md:p-8 lg:p-9"><p className="ip-eyebrow">Workflows</p><h1 className="text-3xl">Automate the follow-through.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Queue reminders and follow-ups reliably without slowing down booking confirmation.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className={`flex items-center gap-3 rounded-panel border p-4 ${emailConfigured ? "bg-primary/10" : "bg-white"}`}>{emailConfigured ? <CheckCircle2 className="size-5 text-brand-green" /> : <CircleAlert className="size-5 text-brand-amber" />}<div><p className="text-sm font-medium">Email delivery</p><p className="text-xs text-muted-foreground">{emailConfigured ? "Resend is configured" : "Add RESEND_API_KEY and EMAIL_FROM"}</p></div></div><div className={`flex items-center gap-3 rounded-panel border p-4 ${cronConfigured ? "bg-primary/10" : "bg-white"}`}>{cronConfigured ? <CheckCircle2 className="size-5 text-brand-green" /> : <CircleAlert className="size-5 text-brand-amber" />}<div><p className="text-sm font-medium">Workflow worker</p><p className="text-xs text-muted-foreground">{cronConfigured ? "Protected cron endpoint is ready" : "Add CRON_SECRET before scheduling the worker"}</p></div></div></div>
    {error && <p role="alert" className="mt-4 rounded-button bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]"><section className="space-y-4">{workflows.map((workflow) => <Card key={workflow.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-[16px] bg-[#151613] text-primary"><Zap className="size-5" /></span><div><div className="flex items-center gap-2"><h2 className="font-semibold">{workflow.name}</h2><span className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase ${workflow.status === "ACTIVE" ? "bg-primary text-[#151613]" : "bg-muted text-muted-foreground"}`}>{workflow.status.toLowerCase()}</span></div><p className="mt-1 text-xs text-muted-foreground">{triggerLabel(workflow)} · {workflow.recipient.toLowerCase()} · {workflow.eventTypeTitle || "All event types"}</p></div></div><Button type="button" variant="ghost" size="sm" onClick={() => toggle(workflow)} disabled={workingId === workflow.id}>{workingId === workflow.id ? <LoaderCircle className="size-4 animate-spin" /> : workflow.status === "ACTIVE" ? <Pause className="size-4" /> : <Play className="size-4" />}{workflow.status === "ACTIVE" ? "Pause" : "Activate"}</Button></div><div className="mt-5 flex gap-5 border-t border-black/[0.07] pt-4 text-xs text-muted-foreground"><span>{workflow.queued} queued</span><span>{workflow.sent} sent</span><span>{workflow.failed} failed</span></div></CardContent></Card>)}</section>
      <Card className="h-fit"><CardHeader><CardTitle>New workflow</CardTitle></CardHeader><CardContent><form onSubmit={create} className="space-y-4"><label className="block text-sm font-medium">Name<Input className="mt-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="block text-sm font-medium">Event type<select className="ip-input mt-2" value={form.eventTypeId} onChange={(event) => setForm({ ...form, eventTypeId: event.target.value })}><option value="">All event types</option>{eventTypes.map((eventType) => <option key={eventType.id} value={eventType.id}>{eventType.title}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Trigger<select className="ip-input mt-2" value={form.trigger} onChange={(event) => setForm({ ...form, trigger: event.target.value })}><option value="BOOKING_CREATED">Booking created</option><option value="BEFORE_START">Before start</option><option value="AFTER_END">After meeting</option><option value="BOOKING_CANCELED">Booking canceled</option></select></label><label className="block text-sm font-medium">Offset (minutes)<Input className="mt-2" type="number" min={0} value={form.offsetMinutes} onChange={(event) => setForm({ ...form, offsetMinutes: Number(event.target.value) })} /></label></div><label className="block text-sm font-medium">Recipient<select className="ip-input mt-2" value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })}><option value="INVITEE">Invitee</option><option value="HOST">Host</option></select></label><label className="block text-sm font-medium">Subject<Input className="mt-2" required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label className="block text-sm font-medium">Message<textarea className="ip-input mt-2 min-h-40 resize-y" required value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label><p className="text-xs leading-5 text-muted-foreground">Variables: {"{{invitee_name}}, {{event_title}}, {{host_name}}, {{start_time}}, {{meet_link}}, {{manage_url}}"}</p><Button className="w-full" disabled={creating}>{creating ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{creating ? "Creating…" : "Create workflow"}</Button></form></CardContent></Card>
    </div></main>;
}

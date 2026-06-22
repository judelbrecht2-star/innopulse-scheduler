"use client";

import { ExternalLink, LoaderCircle, Plus, Route, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EventTypeOption = { id: string; title: string };
type ExistingForm = { id: string; name: string; slug: string; status: string };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function RoutingManager({ username, eventTypes, forms }: { username: string; eventTypes: EventTypeOption[]; forms: ExistingForm[] }) {
  const router = useRouter();
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [questionLabel, setQuestionLabel] = useState("What would you like help with?");
  const [options, setOptions] = useState([{ label: "", eventTypeId: eventTypes[0]?.id ?? "" }, { label: "", eventTypeId: eventTypes[0]?.id ?? "" }]);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const response = await fetch("/api/dashboard/routing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, questionLabel, options, fallbackEventTypeId: null, status: "ACTIVE" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to create routing form.");
      setName(""); setSlug(""); setOptions([{ label: "", eventTypeId: eventTypes[0]?.id ?? "" }, { label: "", eventTypeId: eventTypes[0]?.id ?? "" }]); router.refresh();
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Unable to create routing form."); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-6xl p-5 pb-24 md:p-8 lg:p-9"><p className="ip-eyebrow">Routing forms</p><h1 className="text-3xl">Route every enquiry.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Ask one focused question and send each invitee to the right event type.</p><div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
    <section className="space-y-4">{forms.map((form) => <Card key={form.id}><CardContent className="flex items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-button bg-muted text-brand-green"><Route className="size-5" /></span><div><h2 className="font-medium">{form.name}</h2><p className="mt-1 text-xs text-muted-foreground">/r/{username}/{form.slug} · {form.status.toLowerCase()}</p></div></div>{form.status === "ACTIVE" && <Button asChild variant="ghost" size="sm"><Link href={`/r/${username}/${form.slug}`} target="_blank"><ExternalLink className="size-4" />Open</Link></Button>}</CardContent></Card>)}{forms.length === 0 && <Card className="border-dashed shadow-none"><CardContent className="py-12 text-center text-sm text-muted-foreground">No routing forms yet.</CardContent></Card>}</section>
    <Card className="h-fit"><CardHeader><CardTitle>New routing form</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Name<Input className="mt-2" required value={name} onChange={(event) => { setName(event.target.value); setSlug(slugify(event.target.value)); }} /></label><label className="block text-sm font-medium">Public link<Input className="mt-2" required value={slug} onChange={(event) => setSlug(slugify(event.target.value))} /></label><label className="block text-sm font-medium">Question<Input className="mt-2" required value={questionLabel} onChange={(event) => setQuestionLabel(event.target.value)} /></label><div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Answer routes</p><Button type="button" size="sm" variant="ghost" onClick={() => setOptions((current) => [...current, { label: "", eventTypeId: eventTypes[0]?.id ?? "" }])}><Plus className="size-4" />Add</Button></div>{options.map((option, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input aria-label={`Route answer ${index + 1}`} required placeholder="Answer" value={option.label} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><select aria-label={`Route event ${index + 1}`} className="ip-input" value={option.eventTypeId} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, eventTypeId: event.target.value } : item))}>{eventTypes.map((eventType) => <option key={eventType.id} value={eventType.id}>{eventType.title}</option>)}</select><Button type="button" variant="ghost" size="icon" aria-label={`Remove route ${index + 1}`} disabled={options.length <= 2} onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button></div>)}</div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={saving || eventTypes.length === 0}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Route className="size-4" />}{saving ? "Creating…" : "Create routing form"}</Button></form></CardContent></Card>
  </div></main>;
}

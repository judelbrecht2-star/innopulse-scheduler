"use client";

import { ArrowLeft, MailCheck, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyBookingLinkButton } from "@/components/dashboard/copy-booking-link-button";

type Question = {
  type: "SHORT_TEXT" | "LONG_TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "SINGLE_SELECT" | "MULTI_SELECT" | "CHECKBOX";
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  options: string[];
};

export type EventTypeFormValue = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE";
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
  bookingWindowDays: number;
  maxBookingsPerDay: number | null;
  requiresConfirmation: boolean;
  confirmationEmailEnabled: boolean;
  confirmationEmailSubject: string;
  confirmationEmailMessage: string;
  meetingAgenda: string;
  homeworkCtaLabel: string;
  homeworkCtaUrl: string;
  locationType: "GOOGLE_MEET" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON" | "CUSTOM";
  locationValue: string;
  questions: Question[];
  schedulingType: "INDIVIDUAL" | "ROUND_ROBIN" | "COLLECTIVE";
  hostIds: string[];
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const fieldLabel = "block text-sm font-medium text-foreground";
const selectClass = "ip-input mt-2 appearance-none";

export function EventTypeForm({ initialValue, username, members }: { initialValue: EventTypeFormValue; username: string; members: Array<{ id: string; name: string; email: string }> }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValue.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setNumber(key: keyof EventTypeFormValue, raw: string, nullable = false) {
    setValue((current) => ({ ...current, [key]: nullable && raw === "" ? null : Number(raw) }));
  }

  function addQuestion() {
    setValue((current) => ({
      ...current,
      questions: [...current.questions, { type: "SHORT_TEXT", label: "", placeholder: "", helpText: "", required: false, options: [] }],
    }));
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setValue((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(value.id ? `/api/dashboard/event-types/${value.id}` : "/api/dashboard/event-types", {
        method: value.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save this event type.");
      router.push("/dashboard/event-types");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save this event type.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <Link href="/dashboard/event-types" className="inline-flex items-center gap-2 rounded-pill border border-black/[0.07] bg-white px-3.5 py-2 text-xs font-medium text-muted-foreground transition-[border-color,color,transform] hover:-translate-x-0.5 hover:border-brand-green/40 hover:text-foreground">
        <ArrowLeft className="size-4" /> Event types
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="ip-eyebrow">{value.id ? "Edit event type" : "New event type"}</p>
          <h1 className="text-3xl">{value.id ? value.title : "Create a booking experience"}{(value.id ? value.title : "Create a booking experience").endsWith(".") ? "" : "."}</h1>
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save event type"}</Button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-button bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Meeting details</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <label className={`${fieldLabel} sm:col-span-2`}>
                Event name
                <Input className="mt-2" required value={value.title} onChange={(event) => {
                  const title = event.target.value;
                  setValue((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) }));
                }} />
              </label>
              <label className={`${fieldLabel} sm:col-span-2`}>
                Booking link
                <div className="mt-2 flex overflow-hidden rounded-input border-1.5 bg-white focus-within:border-brand-green focus-within:shadow-focus-lime">
                  <span className="hidden items-center border-r bg-muted px-3 text-sm text-muted-foreground sm:flex">/{username}/</span>
                  <input className="min-w-0 flex-1 bg-transparent px-[14px] py-[13px] text-button outline-none" required value={value.slug} onChange={(event) => { setSlugTouched(true); setValue((current) => ({ ...current, slug: slugify(event.target.value) })); }} />
                </div>
                {value.id && value.slug && <span className="mt-3 flex"><CopyBookingLinkButton username={username} slug={value.slug} /></span>}
              </label>
              <label className={`${fieldLabel} sm:col-span-2`}>
                Description
                <textarea className="ip-input mt-2 min-h-28 resize-y" value={value.description} onChange={(event) => setValue((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className={fieldLabel}>
                Duration
                <select className={selectClass} value={value.durationMinutes} onChange={(event) => setNumber("durationMinutes", event.target.value)}>
                  {[15, 20, 30, 45, 60, 90, 120].map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
                </select>
              </label>
              <label className={fieldLabel}>
                Location
                <select className={selectClass} value={value.locationType} onChange={(event) => setValue((current) => ({ ...current, locationType: event.target.value as EventTypeFormValue["locationType"] }))}>
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                  <option value="PHONE">Phone call</option>
                  <option value="IN_PERSON">In person</option>
                  <option value="CUSTOM">Custom location</option>
                </select>
              </label>
              {!['GOOGLE_MEET', 'MICROSOFT_TEAMS'].includes(value.locationType) && (
                <label className={`${fieldLabel} sm:col-span-2`}>
                  Location instructions
                  <Input className="mt-2" value={value.locationValue} onChange={(event) => setValue((current) => ({ ...current, locationValue: event.target.value }))} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Team scheduling</CardTitle><p className="mt-1 text-sm text-muted-foreground">Choose how hosts share this event type.</p></CardHeader>
            <CardContent className="space-y-5">
              <label className={fieldLabel}>Scheduling strategy
                <select className={selectClass} value={value.schedulingType} onChange={(event) => {
                  const schedulingType = event.target.value as EventTypeFormValue["schedulingType"];
                  setValue((current) => ({ ...current, schedulingType, hostIds: schedulingType === "INDIVIDUAL" ? current.hostIds.slice(0, 1) : current.hostIds }));
                }}><option value="INDIVIDUAL">Individual host</option><option value="ROUND_ROBIN">Round robin</option><option value="COLLECTIVE">Collective availability</option></select>
              </label>
              <div><p className="text-sm font-medium">Hosts</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{members.map((member) => {
                const checked = value.hostIds.includes(member.id);
                return <label key={member.id} className="flex items-center gap-3 rounded-button border bg-white p-3 text-sm"><input type={value.schedulingType === "INDIVIDUAL" ? "radio" : "checkbox"} name="event-host" className="size-4 accent-brand-navy" checked={checked} onChange={(event) => setValue((current) => ({ ...current, hostIds: current.schedulingType === "INDIVIDUAL" ? [member.id] : event.target.checked ? [...current.hostIds, member.id] : current.hostIds.filter((id) => id !== member.id) }))} /><span><strong className="block font-medium">{member.name}</strong><span className="text-xs text-muted-foreground">{member.email}</span></span></label>;
              })}</div></div>
              <p className="text-xs leading-5 text-muted-foreground">Round robin offers a slot when any host is free and assigns the least-loaded host. Collective events require every selected host to be free.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div><CardTitle>Invitee questions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Collect the context you need before the meeting.</p></div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}><Plus className="size-4" /> Add</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {value.questions.length === 0 && <p className="rounded-button border border-dashed p-5 text-sm text-muted-foreground">No custom questions yet.</p>}
              {value.questions.map((question, index) => (
                <div key={index} className="rounded-panel border bg-background/40 p-4">
                  <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto]">
                    <label className={fieldLabel}>Type
                      <select className={selectClass} value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value as Question["type"] })}>
                        <option value="SHORT_TEXT">Short text</option><option value="LONG_TEXT">Long text</option><option value="EMAIL">Email</option><option value="PHONE">Phone</option><option value="NUMBER">Number</option><option value="SINGLE_SELECT">Single select</option><option value="MULTI_SELECT">Multi select</option><option value="CHECKBOX">Checkbox</option>
                      </select>
                    </label>
                    <label className={fieldLabel}>Question
                      <Input className="mt-2" required value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} />
                    </label>
                    <Button type="button" variant="ghost" size="icon" className="mt-6 text-destructive" aria-label={`Remove question ${index + 1}`} onClick={() => setValue((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}><Trash2 className="size-4" /></Button>
                  </div>
                  {(question.type === "SINGLE_SELECT" || question.type === "MULTI_SELECT") && <label className={`${fieldLabel} mt-4`}>Options, separated by commas<Input className="mt-2" value={question.options.join(", ")} onChange={(event) => updateQuestion(index, { options: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>}
                  <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-brand-navy" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Required</label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-button bg-secondary text-brand-navy"><MailCheck className="size-5" /></span><div><CardTitle>Client confirmation email</CardTitle><p className="mt-1 text-sm text-muted-foreground">Sent after the slot is rechecked and the Google Meet invitation is created.</p></div></div></CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-start gap-3 rounded-panel border p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-brand-navy" checked={value.confirmationEmailEnabled} onChange={(event) => setValue((current) => ({ ...current, confirmationEmailEnabled: event.target.checked }))} /><span><strong className="block font-medium">Send branded confirmation email</strong><span className="text-muted-foreground">Includes meeting details, Meet link, preparation, and an RSVP reminder.</span></span></label>
              <label className={fieldLabel}>Subject<Input className="mt-2" required={value.confirmationEmailEnabled} value={value.confirmationEmailSubject} onChange={(event) => setValue((current) => ({ ...current, confirmationEmailSubject: event.target.value }))} /></label>
              <label className={fieldLabel}>Thank-you message<textarea className="ip-input mt-2 min-h-24 resize-y" required={value.confirmationEmailEnabled} value={value.confirmationEmailMessage} onChange={(event) => setValue((current) => ({ ...current, confirmationEmailMessage: event.target.value }))} /></label>
              <label className={fieldLabel}>What to expect <span className="font-normal text-muted-foreground">(one agenda item per line)</span><textarea className="ip-input mt-2 min-h-28 resize-y" value={value.meetingAgenda} onChange={(event) => setValue((current) => ({ ...current, meetingAgenda: event.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className={fieldLabel}>Preparation button label<Input className="mt-2" value={value.homeworkCtaLabel} onChange={(event) => setValue((current) => ({ ...current, homeworkCtaLabel: event.target.value }))} /></label><label className={fieldLabel}>Preparation URL<Input className="mt-2" type="url" placeholder="https://…" value={value.homeworkCtaUrl} onChange={(event) => setValue((current) => ({ ...current, homeworkCtaUrl: event.target.value }))} /></label></div>
              <p className="rounded-button bg-brand-cream-2/70 p-4 text-xs leading-5 text-muted-foreground">The Google Calendar invitation is sent separately and asks the client to accept or decline. Their response appears on your Google Calendar.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <label className={fieldLabel}>Status<select className={selectClass} value={value.status} onChange={(event) => setValue((current) => ({ ...current, status: event.target.value as "DRAFT" | "ACTIVE" }))}><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option></select></label>
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-brand-navy" checked={value.requiresConfirmation} onChange={(event) => setValue((current) => ({ ...current, requiresConfirmation: event.target.checked }))} /><span><strong className="block font-medium">Require confirmation</strong><span className="text-muted-foreground">Hold new requests for host approval.</span></span></label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Scheduling limits</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <label className={fieldLabel}>Start-time interval<Input className="mt-2" type="number" min={5} value={value.slotIntervalMinutes} onChange={(event) => setNumber("slotIntervalMinutes", event.target.value)} /></label>
              <label className={fieldLabel}>Minimum notice (minutes)<Input className="mt-2" type="number" min={0} value={value.minimumNoticeMinutes} onChange={(event) => setNumber("minimumNoticeMinutes", event.target.value)} /></label>
              <label className={fieldLabel}>Booking window (days)<Input className="mt-2" type="number" min={1} value={value.bookingWindowDays} onChange={(event) => setNumber("bookingWindowDays", event.target.value)} /></label>
              <label className={fieldLabel}>Daily booking limit<Input className="mt-2" type="number" min={1} placeholder="No limit" value={value.maxBookingsPerDay ?? ""} onChange={(event) => setNumber("maxBookingsPerDay", event.target.value, true)} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className={fieldLabel}>Buffer before<Input className="mt-2" type="number" min={0} value={value.bufferBeforeMinutes} onChange={(event) => setNumber("bufferBeforeMinutes", event.target.value)} /></label>
                <label className={fieldLabel}>Buffer after<Input className="mt-2" type="number" min={0} value={value.bufferAfterMinutes} onChange={(event) => setNumber("bufferAfterMinutes", event.target.value)} /></label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

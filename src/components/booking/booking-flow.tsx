"use client";

import { parseISO, startOfMonth } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CalendarGrid, CalendarHeader } from "@/components/booking/calendar-grid";
import { IntakeForm } from "@/components/booking/intake-form";
import { SlotPicker } from "@/components/booking/slot-picker";
import { TimezoneSelect } from "@/components/booking/timezone-select";
import type { PublicEventType, PublicSlot } from "@/components/booking/types";

export function BookingFlow({ eventType, rescheduleUid }: { eventType: PublicEventType; rescheduleUid?: string }) {
  const router = useRouter();
  const [timeZone, setTimeZone] = useState(eventType.hostTimeZone);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      // The browser timezone is an external value that only exists after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeZone(detected);
      setCurrentMonth(startOfMonth(parseISO(formatInTimeZone(new Date(), detected, "yyyy-MM-dd"))));
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    // Reset the request UI whenever the selected date or timezone changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setSlotError(null);
    setSelectedSlot(null);

    fetch(
      `/api/availability/${eventType.id}/slots?date=${encodeURIComponent(selectedDate)}&timeZone=${encodeURIComponent(timeZone)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load available times.");
        setSlots(data.slots);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setSlotError(error.message);
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [eventType.id, selectedDate, timeZone]);

  async function submitBooking(details: {
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    answers: Array<{ questionId: string; value: string | string[] | boolean | number }>;
  }) {
    if (!selectedSlot) return;
    setSubmitting(true);
    setBookingError(null);
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          eventTypeId: eventType.id,
          start: selectedSlot.start,
          timeZone,
          idempotencyKey: idempotencyKey.current,
          rescheduleUid,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to confirm your booking.");
      router.push(`/${eventType.username}/${eventType.slug}/success?booking=${encodeURIComponent(data.uid)}`);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Unable to confirm your booking.");
      setSubmitting(false);
    }
  }

  const selectedSummary = selectedSlot
    ? `${formatInTimeZone(new Date(selectedSlot.start), timeZone, "EEEE, d MMMM")} at ${new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(selectedSlot.start))}`
    : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#181a17] px-4 pb-10 pt-5 text-white sm:px-6 lg:px-8">
      <header className="mx-auto mb-5 flex max-w-[1380px] items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="InnoPulse home"><span className="flex h-14 w-24 items-center justify-center rounded-panel bg-white p-2"><Image src="/branding/innopulse-growth-arrows.png" alt="" width={512} height={305} className="h-full w-full object-contain" priority /></span><span><strong className="block text-sm font-semibold">InnoPulse</strong><span className="text-xs text-white/45">by The Growth System</span></span></Link>
        <span className="rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/65">{rescheduleUid ? "Reschedule" : "Book a meeting"}</span>
      </header>

      <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[28px] border border-white/10 bg-[#20221f] shadow-[0_30px_90px_rgba(0,0,0,.32)]">
        <div className="grid xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden border-b border-white/10 bg-[#121411] p-7 sm:p-9 xl:min-h-[720px] xl:border-b-0 xl:border-r">
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Hosted by {eventType.hostName}</p>
              <h1 className="mt-4 max-w-[230px] text-[clamp(2.35rem,4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]">{eventType.title}</h1>
              {eventType.description && <p className="mt-5 max-w-[235px] text-sm leading-6 text-white/55">{eventType.description}</p>}
              <div className="mt-7 flex flex-wrap gap-2 text-xs"><span className="inline-flex items-center gap-2 rounded-pill bg-primary px-3 py-2 font-medium text-primary-foreground"><Clock3 className="size-3.5" />{eventType.durationMinutes} min</span><span className="inline-flex items-center gap-2 rounded-pill bg-[#ffd43b] px-3 py-2 font-medium text-[#201c00]"><MapPin className="size-3.5" />{eventType.locationType === "GOOGLE_MEET" ? "Google Meet" : eventType.locationType.replaceAll("_", " ")}</span></div>
              {selectedSummary && <p className="mt-5 flex items-start gap-3 rounded-panel border border-white/10 bg-white/5 p-4 text-sm leading-5 text-white/85"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />{selectedSummary}</p>}
              <div className="mt-10 border-t border-white/10 pt-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">How it works</p>
                <ol className="mt-4 space-y-4 text-sm text-white/65">
                  {["Pick your date", "Choose a time", "Share your details"].map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary bg-transparent text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>

          <div className="p-5 sm:p-7 lg:p-9">
            {!selectedSlot ? (
              <>
                <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
                  <CalendarHeader
                    currentMonth={currentMonth}
                    timeZone={timeZone}
                    aside={<TimezoneSelect value={timeZone} onChange={setTimeZone} />}
                    onMonthChange={setCurrentMonth}
                  />
                  <CalendarGrid
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    timeZone={timeZone}
                    bookingWindowDays={eventType.bookingWindowDays}
                    onSelectDate={setSelectedDate}
                  />
                  {selectedDate ? (
                    <SlotPicker
                      date={selectedDate}
                      timeZone={timeZone}
                      slots={slots}
                      loading={loadingSlots}
                      error={slotError}
                      selectedStart={null}
                      onSelect={setSelectedSlot}
                    />
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-white/[0.025] p-7 text-center text-sm leading-6 text-white/45">
                      <span className="mb-5 flex size-20 items-center justify-center rounded-full bg-[#8f46ff] text-2xl font-semibold text-white shadow-[0_0_0_12px_rgba(143,70,255,.1)]">→</span><strong className="text-base text-white">Pick a date</strong><span className="mt-1 max-w-40">Available times will appear here.</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <IntakeForm
                questions={eventType.questions}
                submitting={submitting}
                error={bookingError}
                onBack={() => { setSelectedSlot(null); setBookingError(null); }}
                onSubmit={submitBooking}
              />
            )}
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-white/35">Times convert automatically to your selected timezone.</p>
    </main>
  );
}

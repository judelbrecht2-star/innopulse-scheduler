"use client";

import { format, parseISO } from "date-fns";
import { ArrowRight, Clock3, LoaderCircle } from "lucide-react";

import type { PublicSlot } from "@/components/booking/types";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  date: string;
  timeZone: string;
  slots: PublicSlot[];
  loading: boolean;
  error: string | null;
  selectedStart: string | null;
  onSelect: (slot: PublicSlot) => void;
}

export function SlotPicker({
  date,
  timeZone,
  slots,
  loading,
  error,
  selectedStart,
  onSelect,
}: SlotPickerProps) {
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section aria-label="Choose a time" className="min-h-[360px] rounded-[22px] border border-white/10 bg-[#151714] p-5">
      <div className="mb-5 border-b border-white/10 pb-4"><p className="text-[10px] uppercase tracking-[0.16em] text-[#13c5e9]">Available times</p><p className="mt-2 text-base font-medium text-white">{format(parseISO(date), "EEEE, d MMMM")}</p><p className="mt-1 text-xs text-white/35">{timeZone.replaceAll("_", " ")}</p>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-white/45">
          <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading available times
        </div>
      )}
      {error && <p className="rounded-button bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {!loading && !error && slots.length === 0 && (
        <div className="rounded-button border border-dashed border-white/15 p-5 text-center text-sm leading-6 text-white/45"><Clock3 className="mx-auto mb-3 size-5 text-primary" />
          No times are available on this date. Choose another day.
        </div>
      )}
      {!loading && slots.length > 0 && (
        <div className="grid max-h-[360px] gap-2 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slots.map((slot) => {
            const selected = selectedStart === slot.start;
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "flex min-h-12 items-center justify-between rounded-button border-1.5 px-4 text-sm font-medium transition-[transform,background-color,border-color,color] focus-visible:outline-none focus-visible:shadow-focus-lime",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/10 bg-white/[0.06] text-white hover:translate-x-0.5 hover:border-[#13c5e9] hover:text-[#13c5e9]",
                )}
              >
                {timeFormatter.format(new Date(slot.start))}
                <ArrowRight className="size-4" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

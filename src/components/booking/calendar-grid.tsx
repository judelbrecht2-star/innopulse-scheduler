"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarHeaderProps {
  currentMonth: Date;
  timeZone: string;
  aside: ReactNode;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ currentMonth, timeZone, aside, onMonthChange }: CalendarHeaderProps) {
  const todayKey = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  const previousMonthDisabled = format(endOfMonth(subMonths(currentMonth, 1)), "yyyy-MM-dd") < todayKey;

  return (
    <div className="grid gap-6 border-b border-white/10 pb-6 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.95fr)] lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_250px]">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Choose a date</p>
        <h2 className="mt-2 w-full whitespace-nowrap text-[clamp(7rem,18vw,14rem)] font-semibold uppercase leading-[0.72] tracking-[-0.085em] text-white">
          {format(currentMonth, "MMM")}<span className="text-primary">.</span>
        </h2>
        <p className="mt-2 text-base leading-none text-white/45">{format(currentMonth, "yyyy")}</p>
      </div>

      <div className="flex flex-col">
        {aside}
        <div className="mt-5 flex justify-end gap-1 sm:mt-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/10 text-white hover:bg-white/10"
            aria-label="Previous month"
            disabled={previousMonthDisabled}
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/10 text-white hover:bg-white/10"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: string | null;
  timeZone: string;
  bookingWindowDays: number;
  onSelectDate: (dateKey: string) => void;
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  timeZone,
  bookingWindowDays,
  onSelectDate,
}: CalendarGridProps) {
  const todayKey = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  const lastDateKey = format(addDays(parseISO(todayKey), bookingWindowDays), "yyyy-MM-dd");
  const monthStart = startOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <section aria-label="Choose a date" className="min-w-0">
      <div className="grid grid-cols-7 gap-2 text-center sm:gap-2.5">
        {weekdays.map((weekday) => (
          <span key={weekday} className="py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
            {weekday}
          </span>
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const disabled = dateKey < todayKey || dateKey > lastDateKey;
          const selected = selectedDate === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={disabled}
              aria-label={format(day, "EEEE, d MMMM yyyy")}
              aria-pressed={selected}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "relative aspect-square rounded-full border text-sm font-semibold transition-[transform,background-color,border-color,color] focus-visible:outline-none focus-visible:shadow-focus-lime",
                isCurrentMonth ? "border-white/70 bg-white text-[#171916]" : "border-white/5 bg-white/[0.07] text-white/25",
                !disabled && !selected && "hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground",
                selected && "scale-[1.06] border-primary bg-primary text-primary-foreground shadow-[0_0_0_7px_rgba(168,230,23,.12)] hover:bg-primary",
                disabled && "cursor-not-allowed border-white/5 bg-white/[0.05] text-white/20",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { addDays, addMinutes } from "date-fns";

import {
  hostDateKeysForInterval,
  zonedDateTimeToUtc,
  zonedDayBounds,
} from "@/server/availability/date-time";
import type { GenerateSlotsInput, GeneratedSlot } from "@/server/availability/types";
import { availabilityWindowsForDate } from "@/server/availability/windows";

function overlaps(start: Date, end: Date, busyStart: Date, busyEnd: Date) {
  return start < busyEnd && busyStart < end;
}

export function generateSlots(input: GenerateSlotsInput): GeneratedSlot[] {
  const now = input.now ?? new Date();
  const noticeBoundary = addMinutes(now, input.minimumNoticeMinutes);
  const bookingWindowBoundary = addDays(now, input.bookingWindowDays);
  const inviteeDay = zonedDayBounds(input.selectedDate, input.inviteeTimeZone);
  const hostDateKeys = hostDateKeysForInterval(inviteeDay.start, inviteeDay.end, input.hostTimeZone);
  const slots: GeneratedSlot[] = [];

  for (const hostDateKey of hostDateKeys) {
    if (
      input.maxBookingsPerDay &&
      (input.bookingCountsByHostDate?.[hostDateKey] ?? 0) >= input.maxBookingsPerDay
    ) {
      continue;
    }

    const windows = availabilityWindowsForDate(hostDateKey, input.rules, input.overrides);

    for (const window of windows) {
      for (
        let startMinutes = window.startMinutes;
        startMinutes + input.durationMinutes <= window.endMinutes;
        startMinutes += input.slotIntervalMinutes
      ) {
        const start = zonedDateTimeToUtc(hostDateKey, startMinutes, input.hostTimeZone);
        if (!start) continue;

        const end = addMinutes(start, input.durationMinutes);
        if (start < inviteeDay.start || start >= inviteeDay.end) continue;
        if (start < noticeBoundary || start > bookingWindowBoundary) continue;

        const blockedStart = addMinutes(start, -input.bufferBeforeMinutes);
        const blockedEnd = addMinutes(end, input.bufferAfterMinutes);
        const conflicts = input.busyIntervals.some((busy) =>
          overlaps(blockedStart, blockedEnd, busy.start, busy.end),
        );

        if (!conflicts) slots.push({ start: start.toISOString(), end: end.toISOString() });
      }
    }
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

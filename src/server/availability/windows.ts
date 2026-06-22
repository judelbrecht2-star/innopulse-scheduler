import type { AvailabilityWindow, OverrideInput, ScheduleRuleInput } from "@/server/availability/types";
import { dateKeyDayOfWeek } from "@/server/availability/date-time";

function mergeWindows(windows: AvailabilityWindow[]) {
  const sorted = windows
    .filter(({ startMinutes, endMinutes }) => endMinutes > startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: AvailabilityWindow[] = [];

  for (const window of sorted) {
    const previous = merged.at(-1);
    if (!previous || window.startMinutes > previous.endMinutes) {
      merged.push({ ...window });
    } else {
      previous.endMinutes = Math.max(previous.endMinutes, window.endMinutes);
    }
  }

  return merged;
}

function subtractWindow(windows: AvailabilityWindow[], unavailable: AvailabilityWindow) {
  return windows.flatMap((window) => {
    if (unavailable.endMinutes <= window.startMinutes || unavailable.startMinutes >= window.endMinutes) {
      return [window];
    }

    const result: AvailabilityWindow[] = [];
    if (unavailable.startMinutes > window.startMinutes) {
      result.push({ startMinutes: window.startMinutes, endMinutes: unavailable.startMinutes });
    }
    if (unavailable.endMinutes < window.endMinutes) {
      result.push({ startMinutes: unavailable.endMinutes, endMinutes: window.endMinutes });
    }
    return result;
  });
}

export function availabilityWindowsForDate(
  dateKey: string,
  rules: ScheduleRuleInput[],
  overrides: OverrideInput[],
) {
  const dateOverrides = overrides.filter((override) => override.date === dateKey);
  const allDayUnavailable = dateOverrides.some(
    (override) =>
      override.type === "UNAVAILABLE" &&
      override.startMinutes === undefined &&
      override.endMinutes === undefined,
  );

  if (allDayUnavailable) return [];

  const availableOverrides = dateOverrides.filter(
    (override) =>
      override.type === "AVAILABLE" &&
      override.startMinutes !== undefined &&
      override.endMinutes !== undefined,
  );

  let windows: AvailabilityWindow[] = availableOverrides.length
    ? availableOverrides.map((override) => ({
        startMinutes: override.startMinutes!,
        endMinutes: override.endMinutes!,
      }))
    : rules
        .filter((rule) => rule.dayOfWeek === dateKeyDayOfWeek(dateKey))
        .map(({ startMinutes, endMinutes }) => ({ startMinutes, endMinutes }));

  windows = mergeWindows(windows);

  for (const override of dateOverrides) {
    if (
      override.type === "UNAVAILABLE" &&
      override.startMinutes !== undefined &&
      override.endMinutes !== undefined
    ) {
      windows = subtractWindow(windows, {
        startMinutes: override.startMinutes,
        endMinutes: override.endMinutes,
      });
    }
  }

  return mergeWindows(windows);
}

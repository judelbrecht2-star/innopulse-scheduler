export type OutOfOfficePeriod = {
  startDate: string;
  endDate: string;
  note: string;
};

type UnavailableOverride = { date: Date; note: string | null };

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextDateKey(key: string) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return dateKey(date);
}

export function groupOutOfOfficeOverrides(overrides: UnavailableOverride[]): OutOfOfficePeriod[] {
  const sorted = [...overrides].sort((left, right) => left.date.getTime() - right.date.getTime());
  const periods: OutOfOfficePeriod[] = [];

  for (const override of sorted) {
    const date = dateKey(override.date);
    const note = override.note ?? "";
    const previous = periods.at(-1);
    if (previous && previous.note === note && nextDateKey(previous.endDate) === date) {
      previous.endDate = date;
    } else {
      periods.push({ startDate: date, endDate: date, note });
    }
  }

  return periods;
}

export function datesInRange(startDate: string, endDate: string) {
  const dates: Date[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

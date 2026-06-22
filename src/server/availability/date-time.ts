import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function addDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function dateKeyDayOfWeek(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function databaseTimeToMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export function databaseDateToKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function zonedDateTimeToUtc(dateKey: string, minutes: number, timeZone: string) {
  const localTime = minutesToTime(minutes);
  const utc = fromZonedTime(`${dateKey}T${localTime}:00`, timeZone);
  const roundTrip = formatInTimeZone(utc, timeZone, "yyyy-MM-dd HH:mm");

  return roundTrip === `${dateKey} ${localTime}` ? utc : null;
}

export function zonedDayBounds(dateKey: string, timeZone: string) {
  const start = zonedDateTimeToUtc(dateKey, 0, timeZone);
  const end = zonedDateTimeToUtc(addDateKey(dateKey, 1), 0, timeZone);

  if (!start || !end) throw new Error(`Unable to resolve ${dateKey} in ${timeZone}`);
  return { start, end };
}

export function hostDateKeysForInterval(start: Date, end: Date, hostTimeZone: string) {
  const first = formatInTimeZone(start, hostTimeZone, "yyyy-MM-dd");
  const last = formatInTimeZone(new Date(end.getTime() - 1), hostTimeZone, "yyyy-MM-dd");
  const result: string[] = [];

  for (let current = first; current <= last; current = addDateKey(current, 1)) {
    result.push(current);
  }

  return result;
}

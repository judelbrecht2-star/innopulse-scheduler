import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/lib/prisma";
import { databaseDateToKey, databaseTimeToMinutes, hostDateKeysForInterval, zonedDayBounds } from "@/server/availability/date-time";
import { generateSlots } from "@/server/availability/generate-slots";
import { getGoogleBusyIntervals } from "@/server/calendar/google-calendar";
import { combineHostSlots } from "@/server/teams/combine-host-slots";

type ScheduleWithRules = {
  timeZone: string;
  availabilityRules: Array<{ dayOfWeek: number; startTime: Date; endTime: Date }>;
  overrides: Array<{ date: Date; type: "AVAILABLE" | "UNAVAILABLE"; startTime: Date | null; endTime: Date | null }>;
};

async function slotsForHost(
  hostId: string,
  schedule: ScheduleWithRules,
  eventType: {
    durationMinutes: number; slotIntervalMinutes: number | null; bufferBeforeMinutes: number; bufferAfterMinutes: number;
    minimumNoticeMinutes: number; bookingWindowDays: number; maxBookingsPerDay: number | null;
  },
  selectedDate: string,
  inviteeTimeZone: string,
  now: Date,
) {
  const inviteeDay = zonedDayBounds(selectedDate, inviteeTimeZone);
  const hostDateKeys = hostDateKeysForInterval(inviteeDay.start, inviteeDay.end, schedule.timeZone);
  const firstHostDay = zonedDayBounds(hostDateKeys[0], schedule.timeZone).start;
  const lastHostDay = zonedDayBounds(hostDateKeys.at(-1)!, schedule.timeZone).end;
  const [bookings, googleBusyIntervals] = await Promise.all([
    prisma.booking.findMany({
      where: { hostId, status: { in: ["PENDING", "CONFIRMED"] }, OR: [{ blockedStartAt: { lt: lastHostDay }, blockedEndAt: { gt: firstHostDay } }, { startAt: { gte: firstHostDay, lt: lastHostDay } }] },
      select: { blockedStartAt: true, blockedEndAt: true, startAt: true },
    }),
    getGoogleBusyIntervals(hostId, firstHostDay, lastHostDay),
  ]);
  const bookingCountsByHostDate = bookings.reduce<Record<string, number>>((counts, booking) => {
    const key = formatInTimeZone(booking.startAt, schedule.timeZone, "yyyy-MM-dd"); counts[key] = (counts[key] ?? 0) + 1; return counts;
  }, {});
  return generateSlots({
    selectedDate, inviteeTimeZone, hostTimeZone: schedule.timeZone,
    durationMinutes: eventType.durationMinutes,
    slotIntervalMinutes: eventType.slotIntervalMinutes ?? eventType.durationMinutes,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes,
    bufferAfterMinutes: eventType.bufferAfterMinutes,
    minimumNoticeMinutes: eventType.minimumNoticeMinutes,
    bookingWindowDays: eventType.bookingWindowDays,
    maxBookingsPerDay: eventType.maxBookingsPerDay,
    rules: schedule.availabilityRules.map((rule) => ({ dayOfWeek: rule.dayOfWeek, startMinutes: databaseTimeToMinutes(rule.startTime), endMinutes: databaseTimeToMinutes(rule.endTime) })),
    overrides: schedule.overrides.map((override) => ({ date: databaseDateToKey(override.date), type: override.type, startMinutes: override.startTime ? databaseTimeToMinutes(override.startTime) : undefined, endMinutes: override.endTime ? databaseTimeToMinutes(override.endTime) : undefined })),
    busyIntervals: [...bookings.map((booking) => ({ start: booking.blockedStartAt, end: booking.blockedEndAt })), ...googleBusyIntervals],
    bookingCountsByHostDate, now,
  });
}

export async function getAvailableSlots(eventTypeId: string, selectedDate: string, inviteeTimeZone: string, now = new Date()) {
  const eventType = await prisma.eventType.findFirst({
    where: { id: eventTypeId, status: "ACTIVE" },
    include: {
      owner: { include: { schedules: { where: { isDefault: true }, include: { availabilityRules: true, overrides: true }, take: 1 } } },
      schedule: { include: { availabilityRules: true, overrides: true } },
      hosts: { orderBy: [{ isPrimary: "desc" }, { priority: "asc" }], include: { user: { include: { schedules: { where: { isDefault: true }, include: { availabilityRules: true, overrides: true }, take: 1 } } } } },
      questions: { orderBy: { position: "asc" } },
    },
  });
  if (!eventType?.schedule) return null;

  const hostRecords = eventType.hosts.length ? eventType.hosts.map((host) => host.user) : [eventType.owner];
  const hostAvailability = await Promise.all(hostRecords.map(async (host) => {
    const schedule = host.id === eventType.ownerId ? eventType.schedule! : host.schedules[0];
    return { host, slots: schedule ? await slotsForHost(host.id, schedule, eventType, selectedDate, inviteeTimeZone, now) : [] };
  }));
  const { slots, slotHosts } = combineHostSlots(hostAvailability.map((availability) => ({ hostId: availability.host.id, slots: availability.slots })), eventType.schedulingType === "COLLECTIVE");
  return { eventType, host: hostRecords[0], hosts: hostRecords, slots, slotHosts };
}

export interface AvailabilityWindow {
  startMinutes: number;
  endMinutes: number;
}

export interface ScheduleRuleInput extends AvailabilityWindow {
  dayOfWeek: number;
}

export interface OverrideInput {
  date: string;
  type: "AVAILABLE" | "UNAVAILABLE";
  startMinutes?: number;
  endMinutes?: number;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface GeneratedSlot {
  start: string;
  end: string;
}

export interface GenerateSlotsInput {
  selectedDate: string;
  inviteeTimeZone: string;
  hostTimeZone: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
  bookingWindowDays: number;
  maxBookingsPerDay?: number | null;
  rules: ScheduleRuleInput[];
  overrides: OverrideInput[];
  busyIntervals: BusyInterval[];
  bookingCountsByHostDate?: Record<string, number>;
  now?: Date;
}

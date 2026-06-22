export interface PublicQuestion {
  id: string;
  type:
    | "SHORT_TEXT"
    | "LONG_TEXT"
    | "EMAIL"
    | "PHONE"
    | "NUMBER"
    | "SINGLE_SELECT"
    | "MULTI_SELECT"
    | "CHECKBOX";
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  options: string[];
}

export interface PublicEventType {
  id: string;
  username: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  bookingWindowDays: number;
  minimumNoticeMinutes: number;
  hostName: string;
  hostTimeZone: string;
  locationType: string;
  questions: PublicQuestion[];
}

export interface PublicSlot {
  start: string;
  end: string;
}

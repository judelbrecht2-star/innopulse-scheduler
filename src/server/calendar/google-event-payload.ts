interface GoogleEventPayloadInput {
  uid: string;
  title: string;
  description: string | null;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone: string | null;
  startAt: Date;
  endAt: Date;
  hostTimeZone: string;
  locationType: string;
  location: string | null;
  answers: Array<{ questionLabel: string; value: unknown }>;
  meetingAgenda?: string;
  homeworkCtaLabel?: string;
  homeworkCtaUrl?: string | null;
  manageUrl?: string;
  additionalAttendees?: Array<{ email: string; displayName: string }>;
}

interface GoogleEventPayload {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: Array<{ email: string; displayName: string }>;
  guestsCanInviteOthers: boolean;
  extendedProperties: { private: { bookingUid: string } };
  location?: string;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}

function answerValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

export function buildGoogleEventPayload(input: GoogleEventPayloadInput): GoogleEventPayload {
  const answers = input.answers.map((answer) => `${answer.questionLabel}: ${answerValue(answer.value)}`).join("\n");
  const agenda = input.meetingAgenda?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const description = [
    input.description,
    agenda?.length ? `What to expect:\n${agenda.map((item) => `• ${item}`).join("\n")}` : null,
    input.homeworkCtaUrl ? `Prepare before we meet:\n${input.homeworkCtaLabel || "Complete the preparation"}\n${input.homeworkCtaUrl}` : null,
    `Invitee: ${input.inviteeName} <${input.inviteeEmail}>`,
    input.inviteePhone ? `Phone: ${input.inviteePhone}` : null,
    answers || null,
    input.manageUrl ? `Manage booking: ${input.manageUrl}` : null,
  ].filter(Boolean).join("\n\n");

  return {
    summary: input.title,
    description,
    start: { dateTime: input.startAt.toISOString(), timeZone: input.hostTimeZone },
    end: { dateTime: input.endAt.toISOString(), timeZone: input.hostTimeZone },
    attendees: [{ email: input.inviteeEmail, displayName: input.inviteeName }, ...(input.additionalAttendees ?? [])],
    guestsCanInviteOthers: false,
    extendedProperties: { private: { bookingUid: input.uid } },
    ...(input.locationType === "GOOGLE_MEET" ? {
      conferenceData: {
        createRequest: {
          requestId: `booking-${input.uid}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    } : input.location ? { location: input.location } : {}),
  };
}

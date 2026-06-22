import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildGoogleEventPayload } from "@/server/calendar/google-event-payload";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export class GoogleCalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  timeZone?: string;
  primary?: boolean;
  accessRole?: string;
};

type GoogleEventResponse = {
  id: string;
  htmlLink?: string;
  iCalUID?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

export async function ensureGoogleCalendarConnection(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    include: { user: { select: { email: true } } },
  });
  if (!account) return null;

  return prisma.calendarConnection.upsert({
    where: { accountId: account.id },
    update: { providerEmail: account.user.email },
    create: {
      userId,
      accountId: account.id,
      provider: "GOOGLE",
      providerEmail: account.user.email,
    },
    include: { account: true },
  });
}

async function markConnectionError(connectionId: string, error: unknown, reauth = false) {
  const message = error instanceof Error ? error.message : "Google Calendar request failed.";
  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: { status: reauth ? "REAUTH_REQUIRED" : "ERROR", lastError: message.slice(0, 1000) },
  });
}

async function getGoogleAccessToken(userId: string, forceRefresh = false) {
  const connection = await ensureGoogleCalendarConnection(userId);
  if (!connection) return null;

  const expiresAt = connection.account.expires_at ? connection.account.expires_at * 1000 : 0;
  const tokenIsFresh = connection.account.access_token && expiresAt > Date.now() + 60_000;
  if (!forceRefresh && tokenIsFresh) return { token: connection.account.access_token!, connection };

  if (!connection.account.refresh_token) {
    await markConnectionError(connection.id, new Error("Google access must be reconnected."), true);
    throw new GoogleCalendarError("Google Calendar must be reconnected.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new GoogleCalendarError("Google OAuth credentials are not configured.");

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.account.refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number; scope?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    await markConnectionError(connection.id, new Error(payload.error_description || "Google token refresh failed."), true);
    throw new GoogleCalendarError("Google Calendar must be reconnected.");
  }

  await prisma.$transaction([
    prisma.account.update({
      where: { id: connection.accountId },
      data: {
        access_token: payload.access_token,
        expires_at: Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600),
        scope: payload.scope ?? connection.account.scope,
      },
    }),
    prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { status: "ACTIVE", lastError: null },
    }),
  ]);

  return { token: payload.access_token, connection };
}

async function googleFetch(userId: string, url: string, init?: RequestInit) {
  const credentials = await getGoogleAccessToken(userId);
  if (!credentials) return null;

  const makeRequest = (token: string) => fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(10_000),
  });

  let response = await makeRequest(credentials.token);
  if (response.status === 401) {
    const refreshed = await getGoogleAccessToken(userId, true);
    if (!refreshed) return null;
    response = await makeRequest(refreshed.token);
  }
  return { response, connection: credentials.connection };
}

export async function syncGoogleCalendars(userId: string) {
  const request = await googleFetch(userId, `${GOOGLE_CALENDAR_API}/users/me/calendarList?maxResults=250&minAccessRole=reader`);
  if (!request) return [];

  const payload = await request.response.json().catch(() => ({})) as { items?: GoogleCalendarListItem[]; error?: { message?: string } };
  if (!request.response.ok) {
    const error = new GoogleCalendarError(payload.error?.message || "Unable to read Google calendars.");
    await markConnectionError(request.connection.id, error, request.response.status === 401 || request.response.status === 403);
    throw error;
  }

  const items = payload.items ?? [];
  await prisma.$transaction(async (transaction) => {
    for (const calendar of items) {
      const existing = await transaction.externalCalendar.findUnique({
        where: { connectionId_externalId: { connectionId: request.connection.id, externalId: calendar.id } },
        select: { isConflictCalendar: true, isDestination: true },
      });
      await transaction.externalCalendar.upsert({
        where: { connectionId_externalId: { connectionId: request.connection.id, externalId: calendar.id } },
        update: {
          name: calendar.summary || calendar.id,
          timeZone: calendar.timeZone,
          isPrimary: Boolean(calendar.primary),
          readOnly: calendar.accessRole === "reader" || calendar.accessRole === "freeBusyReader",
        },
        create: {
          connectionId: request.connection.id,
          externalId: calendar.id,
          name: calendar.summary || calendar.id,
          timeZone: calendar.timeZone,
          isPrimary: Boolean(calendar.primary),
          isConflictCalendar: existing?.isConflictCalendar ?? true,
          isDestination: existing?.isDestination ?? Boolean(calendar.primary),
          readOnly: calendar.accessRole === "reader" || calendar.accessRole === "freeBusyReader",
        },
      });
    }
    await transaction.calendarConnection.update({
      where: { id: request.connection.id },
      data: { status: "ACTIVE", lastSyncedAt: new Date(), lastError: null },
    });
  });

  return prisma.externalCalendar.findMany({
    where: { connectionId: request.connection.id },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });
}

export async function getGoogleBusyIntervals(userId: string, timeMin: Date, timeMax: Date) {
  const connection = await ensureGoogleCalendarConnection(userId);
  if (!connection) return [];

  let calendars = await prisma.externalCalendar.findMany({
    where: { connectionId: connection.id, isConflictCalendar: true },
    select: { externalId: true },
  });
  if (calendars.length === 0) {
    await syncGoogleCalendars(userId);
    calendars = await prisma.externalCalendar.findMany({
      where: { connectionId: connection.id, isConflictCalendar: true },
      select: { externalId: true },
    });
  }
  if (calendars.length === 0) return [];

  const request = await googleFetch(userId, `${GOOGLE_CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: calendars.slice(0, 50).map((calendar) => ({ id: calendar.externalId })),
    }),
  });
  if (!request) return [];

  const payload = await request.response.json().catch(() => ({})) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }>; errors?: unknown[] }>;
    error?: { message?: string };
  };
  if (!request.response.ok) {
    const error = new GoogleCalendarError(payload.error?.message || "Unable to check Google Calendar availability.");
    await markConnectionError(request.connection.id, error, request.response.status === 401 || request.response.status === 403);
    throw error;
  }

  await prisma.calendarConnection.update({
    where: { id: request.connection.id },
    data: { status: "ACTIVE", lastError: null },
  });

  return Object.values(payload.calendars ?? {}).flatMap((calendar) =>
    (calendar.busy ?? []).map((busy) => ({ start: new Date(busy.start), end: new Date(busy.end) })),
  );
}

export async function createGoogleCalendarEvent(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      calendarEvent: true,
      answers: true,
      host: true,
      eventType: { include: { destinationCalendar: true, owner: { select: { username: true } }, hosts: { include: { user: { select: { id: true, name: true, email: true } } } } } },
    },
  });
  if (!booking || booking.status !== "CONFIRMED") return null;
  if (booking.calendarEvent) return booking.calendarEvent;

  const connection = await ensureGoogleCalendarConnection(booking.hostId);
  if (!connection) return null;
  let destination = booking.eventType.destinationCalendar;
  destination ??= await prisma.externalCalendar.findFirst({
    where: { connectionId: connection.id, OR: [{ isDestination: true }, { isPrimary: true }], readOnly: false },
    orderBy: [{ isDestination: "desc" }, { isPrimary: "desc" }],
  });
  if (!destination) {
    await syncGoogleCalendars(booking.hostId);
    destination = await prisma.externalCalendar.findFirst({
      where: { connectionId: connection.id, isPrimary: true, readOnly: false },
    });
  }

  const calendarId = destination?.externalId ?? "primary";
  const eventPayload = buildGoogleEventPayload({
    uid: booking.uid,
    title: booking.title,
    description: booking.description,
    inviteeName: booking.inviteeName,
    inviteeEmail: booking.inviteeEmail,
    inviteePhone: booking.inviteePhone,
    startAt: booking.startAt,
    endAt: booking.endAt,
    hostTimeZone: booking.host.timeZone,
    locationType: booking.eventType.locationType,
    location: booking.location,
    answers: booking.answers,
    meetingAgenda: booking.eventType.meetingAgenda,
    homeworkCtaLabel: booking.eventType.homeworkCtaLabel,
    homeworkCtaUrl: booking.eventType.homeworkCtaUrl,
    manageUrl: booking.eventType.owner.username
      ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/${booking.eventType.owner.username}/${booking.eventType.slug}/manage/${booking.uid}`
      : undefined,
    additionalAttendees: booking.eventType.schedulingType === "COLLECTIVE"
      ? booking.eventType.hosts.filter((host) => host.userId !== booking.hostId && host.user.email).map((host) => ({ email: host.user.email!, displayName: host.user.name ?? host.user.email! }))
      : [],
  });

  const request = await googleFetch(
    booking.hostId,
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventPayload) },
  );
  if (!request) return null;

  const payload = await request.response.json().catch(() => ({})) as GoogleEventResponse & { error?: { message?: string } };
  if (!request.response.ok || !payload.id) {
    const error = new GoogleCalendarError(payload.error?.message || "Unable to create the Google Calendar event.");
    await markConnectionError(request.connection.id, error, request.response.status === 401 || request.response.status === 403);
    throw error;
  }

  const conferenceUrl = payload.hangoutLink ?? payload.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? null;
  return prisma.$transaction(async (transaction) => {
    const calendarEvent = await transaction.calendarEvent.create({
      data: {
        bookingId: booking.id,
        connectionId: request.connection.id,
        externalEventId: payload.id,
        iCalUid: payload.iCalUID,
        htmlLink: payload.htmlLink,
        conferenceUrl,
        conferenceData: { ...(payload.conferenceData ?? {}), calendarId } as Prisma.InputJsonValue,
      },
    });
    await transaction.booking.update({
      where: { id: booking.id },
      data: { location: conferenceUrl ?? booking.location },
    });
    await transaction.calendarConnection.update({
      where: { id: request.connection.id },
      data: { status: "ACTIVE", lastSyncedAt: new Date(), lastError: null },
    });
    return calendarEvent;
  });
}

export async function deleteGoogleCalendarEvent(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { calendarEvent: true },
  });
  if (!booking?.calendarEvent) return { deleted: false };

  const storedData = booking.calendarEvent.conferenceData;
  const calendarId = storedData && typeof storedData === "object" && !Array.isArray(storedData) && typeof storedData.calendarId === "string"
    ? storedData.calendarId
    : "primary";
  const request = await googleFetch(
    booking.hostId,
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(booking.calendarEvent.externalEventId)}?sendUpdates=all`,
    { method: "DELETE" },
  );
  if (!request) return { deleted: false };
  if (!request.response.ok && request.response.status !== 404 && request.response.status !== 410) {
    const payload = await request.response.json().catch(() => ({})) as { error?: { message?: string } };
    const error = new GoogleCalendarError(payload.error?.message || "Unable to remove the Google Calendar event.");
    await markConnectionError(request.connection.id, error, request.response.status === 401 || request.response.status === 403);
    throw error;
  }

  await prisma.$transaction([
    prisma.calendarEvent.delete({ where: { id: booking.calendarEvent.id } }),
    prisma.calendarConnection.update({ where: { id: request.connection.id }, data: { status: "ACTIVE", lastError: null } }),
  ]);
  return { deleted: true };
}

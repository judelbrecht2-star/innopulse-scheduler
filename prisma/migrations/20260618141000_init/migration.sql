-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HOST', 'ADMIN');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "CalendarConnectionStatus" AS ENUM ('ACTIVE', 'REAUTH_REQUIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "EventTypeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('GOOGLE_MEET', 'MICROSOFT_TEAMS', 'PHONE', 'IN_PERSON', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'REJECTED', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AvailabilityOverrideType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'SINGLE_SELECT', 'MULTI_SELECT', 'CHECKBOX');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMPTZ(3),
    "image" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "locale" TEXT NOT NULL DEFAULT 'en-ZA',
    "weekStart" INTEGER NOT NULL DEFAULT 1,
    "role" "UserRole" NOT NULL DEFAULT 'HOST',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "providerEmail" TEXT,
    "status" "CalendarConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCalendar" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isConflictCalendar" BOOLEAN NOT NULL DEFAULT true,
    "isDestination" BOOLEAN NOT NULL DEFAULT false,
    "readOnly" BOOLEAN NOT NULL DEFAULT false,
    "syncToken" TEXT,
    "channelId" TEXT,
    "channelResource" TEXT,
    "channelExpiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ExternalCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "AvailabilityOverrideType" NOT NULL,
    "startTime" TIME(0),
    "endTime" TIME(0),
    "note" TEXT,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "destinationCalendarId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "EventTypeStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER NOT NULL,
    "slotIntervalMinutes" INTEGER,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 60,
    "maxBookingsPerDay" INTEGER,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "allowGuests" BOOLEAN NOT NULL DEFAULT false,
    "locationType" "LocationType" NOT NULL DEFAULT 'GOOGLE_MEET',
    "locationValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTypeHost" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "EventTypeHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuestion" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "options" JSONB,

    CONSTRAINT "EventQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "eventTypeId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "blockedStartAt" TIMESTAMPTZ(3) NOT NULL,
    "blockedEndAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteePhone" TEXT,
    "inviteeTimeZone" TEXT NOT NULL,
    "inviteeLocale" TEXT NOT NULL DEFAULT 'en',
    "cancellationReason" TEXT,
    "rejectionReason" TEXT,
    "canceledAt" TIMESTAMPTZ(3),
    "rescheduledFromId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAnswer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "questionId" TEXT,
    "questionLabel" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "BookingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "connectionId" TEXT,
    "externalEventId" TEXT NOT NULL,
    "iCalUid" TEXT,
    "htmlLink" TEXT,
    "conferenceUrl" TEXT,
    "conferenceData" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_accountId_key" ON "CalendarConnection"("accountId");

-- CreateIndex
CREATE INDEX "CalendarConnection_userId_provider_idx" ON "CalendarConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "ExternalCalendar_connectionId_isConflictCalendar_idx" ON "ExternalCalendar"("connectionId", "isConflictCalendar");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCalendar_connectionId_externalId_key" ON "ExternalCalendar"("connectionId", "externalId");

-- CreateIndex
CREATE INDEX "Schedule_ownerId_isDefault_idx" ON "Schedule"("ownerId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_ownerId_name_key" ON "Schedule"("ownerId", "name");

-- CreateIndex
CREATE INDEX "AvailabilityRule_scheduleId_dayOfWeek_idx" ON "AvailabilityRule"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_scheduleId_dayOfWeek_startTime_endTime_key" ON "AvailabilityRule"("scheduleId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "AvailabilityOverride_scheduleId_date_idx" ON "AvailabilityOverride"("scheduleId", "date");

-- CreateIndex
CREATE INDEX "EventType_ownerId_status_idx" ON "EventType"("ownerId", "status");

-- CreateIndex
CREATE INDEX "EventType_scheduleId_idx" ON "EventType"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_ownerId_slug_key" ON "EventType"("ownerId", "slug");

-- CreateIndex
CREATE INDEX "EventTypeHost_userId_idx" ON "EventTypeHost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTypeHost_eventTypeId_userId_key" ON "EventTypeHost"("eventTypeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventQuestion_eventTypeId_position_key" ON "EventQuestion"("eventTypeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_uid_key" ON "Booking"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_eventTypeId_status_startAt_idx" ON "Booking"("eventTypeId", "status", "startAt");

-- CreateIndex
CREATE INDEX "Booking_hostId_status_startAt_endAt_idx" ON "Booking"("hostId", "status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Booking_inviteeEmail_startAt_idx" ON "Booking"("inviteeEmail", "startAt");

-- CreateIndex
CREATE INDEX "Booking_rescheduledFromId_idx" ON "Booking"("rescheduledFromId");

-- CreateIndex
CREATE INDEX "BookingAnswer_bookingId_idx" ON "BookingAnswer"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAnswer_questionId_idx" ON "BookingAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_bookingId_key" ON "CalendarEvent"("bookingId");

-- CreateIndex
CREATE INDEX "CalendarEvent_connectionId_idx" ON "CalendarEvent"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_connectionId_externalEventId_key" ON "CalendarEvent"("connectionId", "externalEventId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_destinationCalendarId_fkey" FOREIGN KEY ("destinationCalendarId") REFERENCES "ExternalCalendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTypeHost" ADD CONSTRAINT "EventTypeHost_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTypeHost" ADD CONSTRAINT "EventTypeHost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuestion" ADD CONSTRAINT "EventQuestion_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "EventQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Scheduling integrity guards not expressible in Prisma schema syntax.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "AvailabilityRule"
ADD CONSTRAINT "AvailabilityRule_valid_day"
CHECK ("dayOfWeek" BETWEEN 0 AND 6);

ALTER TABLE "AvailabilityRule"
ADD CONSTRAINT "AvailabilityRule_valid_range"
CHECK ("endTime" > "startTime");

ALTER TABLE "AvailabilityOverride"
ADD CONSTRAINT "AvailabilityOverride_valid_range"
CHECK (
  ("startTime" IS NULL AND "endTime" IS NULL)
  OR
  ("startTime" IS NOT NULL AND "endTime" IS NOT NULL AND "endTime" > "startTime")
);

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_valid_range"
CHECK (
  "endAt" > "startAt"
  AND "blockedEndAt" > "blockedStartAt"
  AND "blockedStartAt" <= "startAt"
  AND "blockedEndAt" >= "endAt"
);

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_host_no_overlap"
EXCLUDE USING gist (
  "hostId" WITH =,
  tstzrange("blockedStartAt", "blockedEndAt", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));

CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "WorkflowTrigger" AS ENUM ('BOOKING_CREATED', 'BEFORE_START', 'AFTER_END', 'BOOKING_CANCELED');
CREATE TYPE "WorkflowRecipient" AS ENUM ('INVITEE', 'HOST');
CREATE TYPE "WorkflowRunStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED');

CREATE TABLE "Workflow" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "eventTypeId" TEXT,
  "name" TEXT NOT NULL,
  "status" "WorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
  "trigger" "WorkflowTrigger" NOT NULL,
  "offsetMinutes" INTEGER NOT NULL DEFAULT 0,
  "recipient" "WorkflowRecipient" NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowRun" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "scheduledFor" TIMESTAMPTZ(3) NOT NULL,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Workflow_ownerId_status_idx" ON "Workflow"("ownerId", "status");
CREATE INDEX "Workflow_eventTypeId_idx" ON "Workflow"("eventTypeId");
CREATE UNIQUE INDEX "WorkflowRun_workflowId_bookingId_key" ON "WorkflowRun"("workflowId", "bookingId");
CREATE INDEX "WorkflowRun_status_scheduledFor_idx" ON "WorkflowRun"("status", "scheduledFor");
CREATE INDEX "WorkflowRun_bookingId_idx" ON "WorkflowRun"("bookingId");

ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "SchedulingType" AS ENUM ('INDIVIDUAL', 'ROUND_ROBIN', 'COLLECTIVE');
CREATE TYPE "RoutingFormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId", "userId")
);

CREATE TABLE "RoutingForm" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "teamId" TEXT,
  "fallbackEventTypeId" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "RoutingFormStatus" NOT NULL DEFAULT 'DRAFT',
  "question" JSONB NOT NULL,
  "routes" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "RoutingForm_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EventType" ADD COLUMN "teamId" TEXT;
ALTER TABLE "EventType" ADD COLUMN "schedulingType" "SchedulingType" NOT NULL DEFAULT 'INDIVIDUAL';

CREATE UNIQUE INDEX "Team_ownerId_slug_key" ON "Team"("ownerId", "slug");
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE UNIQUE INDEX "RoutingForm_ownerId_slug_key" ON "RoutingForm"("ownerId", "slug");
CREATE INDEX "RoutingForm_teamId_status_idx" ON "RoutingForm"("teamId", "status");
CREATE INDEX "RoutingForm_fallbackEventTypeId_idx" ON "RoutingForm"("fallbackEventTypeId");
CREATE INDEX "EventType_teamId_idx" ON "EventType"("teamId");

ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutingForm" ADD CONSTRAINT "RoutingForm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutingForm" ADD CONSTRAINT "RoutingForm_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoutingForm" ADD CONSTRAINT "RoutingForm_fallbackEventTypeId_fkey" FOREIGN KEY ("fallbackEventTypeId") REFERENCES "EventType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

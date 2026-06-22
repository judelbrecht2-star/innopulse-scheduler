ALTER TABLE "EventType"
ADD COLUMN "confirmationEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "confirmationEmailSubject" TEXT NOT NULL DEFAULT 'Your meeting is confirmed',
ADD COLUMN "confirmationEmailMessage" TEXT NOT NULL DEFAULT 'Thank you for booking time with us. We are looking forward to the conversation.',
ADD COLUMN "meetingAgenda" TEXT NOT NULL DEFAULT E'Understand your goals\nExplore the current challenge\nAgree practical next steps',
ADD COLUMN "homeworkCtaLabel" TEXT NOT NULL DEFAULT 'Complete the free assessment',
ADD COLUMN "homeworkCtaUrl" TEXT DEFAULT 'https://innopulse.thegrowthsystem.co.za/';

ALTER TABLE "Booking"
ADD COLUMN "confirmationEmailSentAt" TIMESTAMPTZ(3),
ADD COLUMN "confirmationEmailProviderId" TEXT;

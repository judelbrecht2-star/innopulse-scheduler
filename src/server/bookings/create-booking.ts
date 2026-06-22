import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/server/availability/get-available-slots";
import type { BookingRequest } from "@/server/bookings/validation";
import { selectRoundRobinHost } from "@/server/teams/select-round-robin-host";

export class BookingConflictError extends Error {
  constructor(message = "This time is no longer available.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

function answerIsEmpty(value: BookingRequest["answers"][number]["value"] | undefined) {
  return (
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    value === false
  );
}

export async function createBooking(input: BookingRequest) {
  const existing = await prisma.booking.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, uid: true, status: true, rescheduledFromId: true },
  });
  if (existing) return existing;

  const rescheduledFrom = input.rescheduleUid
    ? await prisma.booking.findFirst({
        where: {
          uid: input.rescheduleUid,
          eventTypeId: input.eventTypeId,
          inviteeEmail: input.inviteeEmail.toLowerCase(),
          status: { in: ["PENDING", "CONFIRMED"] },
          startAt: { gt: new Date() },
        },
        select: { id: true },
      })
    : null;
  if (input.rescheduleUid && !rescheduledFrom) {
    throw new BookingConflictError("This booking cannot be rescheduled. Check the invitee email and try again.");
  }

  const requestedStart = new Date(input.start);
  const selectedDate = formatInTimeZone(requestedStart, input.timeZone, "yyyy-MM-dd");
  const availability = await getAvailableSlots(input.eventTypeId, selectedDate, input.timeZone);

  if (!availability) throw new BookingConflictError("This event type is not available.");

  const slot = availability.slots.find((candidate) => candidate.start === requestedStart.toISOString());
  if (!slot) throw new BookingConflictError();

  const { eventType } = availability;
  const candidateHostIds = availability.slotHosts[requestedStart.toISOString()] ?? [availability.host.id];
  let assignedHostId = candidateHostIds[0];
  if (eventType.schedulingType === "ROUND_ROBIN" && candidateHostIds.length > 1) {
    const counts = await prisma.booking.groupBy({
      by: ["hostId"],
      where: { hostId: { in: candidateHostIds }, status: { in: ["PENDING", "CONFIRMED"] }, startAt: { gte: new Date() } },
      _count: { id: true },
    });
    assignedHostId = selectRoundRobinHost(candidateHostIds, Object.fromEntries(counts.map((count) => [count.hostId, count._count.id])), availability.hosts.map((host) => host.id));
  }
  const host = availability.hosts.find((candidate) => candidate.id === assignedHostId) ?? availability.host;
  const answersByQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer.value]));

  for (const question of eventType.questions) {
    if (question.required && answerIsEmpty(answersByQuestion.get(question.id))) {
      throw new BookingConflictError(`Please answer: ${question.label}`);
    }
  }

  const startAt = new Date(slot.start);
  const endAt = new Date(slot.end);
  const blockedStartAt = addMinutes(startAt, -eventType.bufferBeforeMinutes);
  const blockedEndAt = addMinutes(endAt, eventType.bufferAfterMinutes);

  try {
    const bookingData: Prisma.BookingCreateArgs["data"] = {
        idempotencyKey: input.idempotencyKey,
        eventType: { connect: { id: eventType.id } },
        host: { connect: { id: host.id } },
        rescheduledFrom: rescheduledFrom ? { connect: { id: rescheduledFrom.id } } : undefined,
        startAt,
        endAt,
        blockedStartAt,
        blockedEndAt,
        status: eventType.requiresConfirmation ? "PENDING" : "CONFIRMED",
        title: `${eventType.title} with ${input.inviteeName}`,
        description: eventType.description,
        location: eventType.locationValue,
        inviteeName: input.inviteeName,
        inviteeEmail: input.inviteeEmail.toLowerCase(),
        inviteePhone: input.inviteePhone || null,
        inviteeTimeZone: input.timeZone,
        answers: {
          create: eventType.questions
            .filter((question) => answersByQuestion.has(question.id))
            .map((question) => ({
              questionId: question.id,
              questionLabel: question.label,
              questionType: question.type,
              value: answersByQuestion.get(question.id) as Prisma.InputJsonValue,
            })),
        },
      };
    const select = { id: true, uid: true, status: true, rescheduledFromId: true } as const;

    if (rescheduledFrom) {
      return await prisma.$transaction(async (transaction) => {
        const released = await transaction.booking.updateMany({
          where: { id: rescheduledFrom.id, status: { in: ["PENDING", "CONFIRMED"] } },
          data: { status: "RESCHEDULED", canceledAt: new Date() },
        });
        if (released.count !== 1) throw new BookingConflictError("This booking has already changed.");
        return transaction.booking.create({ data: bookingData, select });
      });
    }

    return await prisma.booking.create({ data: bookingData, select });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await prisma.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true, uid: true, status: true, rescheduledFromId: true },
      });
      if (duplicate) return duplicate;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      (error instanceof Error && error.message.includes("Booking_host_no_overlap"))
    ) {
      throw new BookingConflictError();
    }
    throw error;
  }
}

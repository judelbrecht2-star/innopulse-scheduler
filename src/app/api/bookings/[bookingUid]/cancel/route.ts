import { NextResponse } from "next/server";
import { z } from "zod";

import { BookingLifecycleError, cancelBookingByUid } from "@/server/bookings/lifecycle";

const cancelSchema = z.object({ reason: z.string().trim().max(1000).optional() });

export async function POST(request: Request, context: { params: Promise<{ bookingUid: string }> }) {
  const parsed = cancelSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cancellation reason." }, { status: 400 });
  const { bookingUid } = await context.params;
  try {
    return NextResponse.json(await cancelBookingByUid(bookingUid, parsed.data.reason));
  } catch (error) {
    if (error instanceof BookingLifecycleError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}

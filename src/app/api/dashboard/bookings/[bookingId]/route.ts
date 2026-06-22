import { NextResponse } from "next/server";
import { z } from "zod";

import { BookingLifecycleError, updateBookingAsHost } from "@/server/bookings/lifecycle";
import { requireHost } from "@/server/dashboard/require-host";

const actionSchema = z.object({
  action: z.enum(["confirm", "reject", "cancel", "no_show"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const user = await requireHost();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking action." }, { status: 400 });
  const { bookingId } = await context.params;

  try {
    const booking = await updateBookingAsHost(bookingId, user.id, parsed.data.action, parsed.data.reason);
    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof BookingLifecycleError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}

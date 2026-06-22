"use client";

import { CalendarSync, LoaderCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ManageBookingActions({ bookingUid, rescheduleHref }: { bookingUid: string; rescheduleHref: string }) {
  const router = useRouter();
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cancelBooking() {
    if (!window.confirm("Cancel this booking? The host will be notified through the calendar invitation.")) return;
    setCanceling(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingUid}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to cancel this booking.");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to cancel this booking.");
      setCanceling(false);
    }
  }

  return (
    <div className="mt-7 border-t pt-6">
      <label className="block text-left text-sm font-medium">Reason for canceling (optional)<textarea className="ip-input mt-2 min-h-24 resize-y" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1"><Link href={rescheduleHref}><CalendarSync className="size-4" />Reschedule</Link></Button>
        <Button type="button" variant="outline" className="flex-1 border-destructive text-destructive" onClick={cancelBooking} disabled={canceling}>{canceling ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}{canceling ? "Canceling…" : "Cancel booking"}</Button>
      </div>
    </div>
  );
}

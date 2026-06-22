"use client";

import { Check, LoaderCircle, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Action = "confirm" | "reject" | "cancel" | "no_show";

export function BookingActions({ bookingId, status, isPast }: { bookingId: string; status: string; isPast: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function perform(action: Action) {
    const destructive = action === "reject" || action === "cancel";
    if (!window.confirm(destructive ? "This will cancel the calendar invitation. Continue?" : `Mark this booking as ${action.replace("_", " ")}?`)) return;
    const reason = destructive ? window.prompt("Reason (optional)") ?? undefined : undefined;
    setWorking(action);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update this booking.");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update this booking.");
      setWorking(null);
    }
  }

  if (status === "PENDING") return <div className="flex flex-wrap justify-end gap-2"><Button type="button" size="sm" onClick={() => perform("confirm")} disabled={Boolean(working)}>{working === "confirm" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Confirm</Button><Button type="button" variant="outline" size="sm" onClick={() => perform("reject")} disabled={Boolean(working)}><X className="size-4" />Reject</Button>{error && <p className="w-full text-xs text-destructive">{error}</p>}</div>;
  if (status === "CONFIRMED" && !isPast) return <div><Button type="button" variant="outline" size="sm" className="border-destructive text-destructive" onClick={() => perform("cancel")} disabled={Boolean(working)}>{working === "cancel" ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}Cancel</Button>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</div>;
  if (status === "CONFIRMED" && isPast) return <Button type="button" variant="outline" size="sm" onClick={() => perform("no_show")} disabled={Boolean(working)}><UserX className="size-4" />No-show</Button>;
  return null;
}

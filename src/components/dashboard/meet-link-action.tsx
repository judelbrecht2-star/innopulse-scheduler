"use client";

import { LoaderCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function MeetLinkAction({ bookingId, meetUrl, canCreate }: { bookingId: string; meetUrl: string | null; canCreate: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (meetUrl) {
    return <Button asChild size="sm"><a href={meetUrl} target="_blank" rel="noreferrer"><Video className="size-4" /> Join Google Meet</a></Button>;
  }
  if (!canCreate) return <p className="text-xs text-muted-foreground">Meet link is created after approval.</p>;

  async function createMeet() {
    if (!window.confirm("Create the Google Meet and send the calendar invitation to this client?")) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}/meet`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create the Google Meet.");
      router.refresh();
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Unable to create the Google Meet.");
      setCreating(false);
    }
  }

  return <div><Button type="button" variant="outline" size="sm" disabled={creating} onClick={createMeet}>{creating ? <LoaderCircle className="size-4 animate-spin" /> : <Video className="size-4" />}{creating ? "Creating Meet…" : "Create Google Meet"}</Button>{error && <p className="mt-2 max-w-48 text-xs text-destructive">{error}</p>}</div>;
}

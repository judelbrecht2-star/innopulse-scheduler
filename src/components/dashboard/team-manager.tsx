"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TeamManager({ team }: { team: { id: string; name: string; slug: string; members: Array<{ id: string; name: string; email: string; role: string }> } }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAdding(true); setMessage(null);
    try {
      const response = await fetch(`/api/dashboard/teams/${team.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to add this member.");
      setEmail(""); setMessage("Team member added."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add this member."); }
    finally { setAdding(false); }
  }

  return (
    <main className="mx-auto max-w-5xl p-5 pb-24 md:p-8 lg:p-9">
      <p className="ip-eyebrow">Teams</p><h1 className="text-3xl">{team.name}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Build shared event types and distribute meetings across your consultants.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card><CardHeader><CardTitle>Members</CardTitle><p className="mt-1 text-sm text-muted-foreground">{team.members.length} active team member{team.members.length === 1 ? "" : "s"}</p></CardHeader><CardContent className="space-y-3">{team.members.map((member, index) => <div key={member.id} className="flex items-center justify-between gap-4 rounded-[18px] border border-black/[0.06] bg-[#f7f8f4] p-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-[#151613] text-primary"><span className="text-sm font-semibold">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || index + 1}</span></span><div><p className="font-semibold">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div><span className="rounded-pill bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#151613]">{member.role.toLowerCase()}</span></div>)}</CardContent></Card>
        <Card className="h-fit"><CardHeader><CardTitle>Add an existing user</CardTitle><p className="mt-1 text-sm text-muted-foreground">They must sign in once before joining the team.</p></CardHeader><CardContent><form onSubmit={addMember} className="space-y-4"><label className="block text-sm font-medium">Email<Input className="mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="block text-sm font-medium">Role<select className="ip-input mt-2" value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "MEMBER")}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></label>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}<Button className="w-full" type="submit" disabled={adding}>{adding ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}{adding ? "Adding…" : "Add member"}</Button></form></CardContent></Card>
      </div>
    </main>
  );
}

"use client";

import { ExternalLink, Globe2, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileState = {
  name: string;
  username: string;
  bio: string;
  image: string;
  allowSearchEngineIndexing: boolean;
};

export function ProfileSettingsForm({ initialProfile, eventTypes }: { initialProfile: ProfileState; eventTypes: Array<{ title: string; durationMinutes: number }> }) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const initials = profile.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "IP";

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save your profile.");
      setMessage({ type: "success", text: "Profile saved. Your public page is up to date." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save your profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader><CardTitle>Profile details</CardTitle><p className="mt-1 text-sm text-muted-foreground">These details appear on your public scheduling page.</p></CardHeader>
        <CardContent className="space-y-5">
          {message && <p role="status" className={`rounded-button p-4 text-sm ${message.type === "success" ? "bg-primary/20 text-brand-navy" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="profile-name">Full name</label>
            <Input id="profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="profile-username">Public username</label>
            <div className="flex rounded-input border-1.5 bg-white focus-within:border-brand-green focus-within:shadow-focus-lime">
              <span className="flex items-center border-r px-3 text-sm text-muted-foreground">/</span>
              <input id="profile-username" className="min-w-0 flex-1 bg-transparent px-[14px] py-[13px] text-button outline-none" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase().replace(/\s+/g, "-") })} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="profile-image">Profile image URL</label>
            <Input id="profile-image" type="url" placeholder="https://…" value={profile.image} onChange={(event) => setProfile({ ...profile, image: event.target.value })} />
            <p className="mt-2 text-xs text-muted-foreground">Leave blank to use your initials.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="profile-bio">About</label>
            <textarea id="profile-bio" className="ip-input min-h-32 resize-y" maxLength={1000} placeholder="Tell invitees what you help with." value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
            <p className="mt-2 text-right text-xs text-muted-foreground">{profile.bio.length}/1000</p>
          </div>
          <label className="flex items-start justify-between gap-5 rounded-panel border p-4">
            <span><span className="block text-sm font-medium">Allow search engine indexing</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Let search engines include your public scheduling profile.</span></span>
            <input className="mt-1 size-4 accent-brand-navy" type="checkbox" checked={profile.allowSearchEngineIndexing} onChange={(event) => setProfile({ ...profile, allowSearchEngineIndexing: event.target.checked })} />
          </label>
          <Button type="button" onClick={save} disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save profile"}</Button>
        </CardContent>
      </Card>

      <div className="xl:sticky xl:top-28 xl:h-fit">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Live preview</p><Link href={`/${profile.username}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-brand-green hover:underline">Open page <ExternalLink className="size-3" /></Link></div>
        <Card className="overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardContent className="p-6">
            {profile.image ? <div className="size-16 rounded-full bg-cover bg-center shadow-card" style={{ backgroundImage: `url(${profile.image})` }} role="img" aria-label={`${profile.name} profile`} /> : <span className="flex size-16 items-center justify-center rounded-full bg-brand-navy text-xl font-semibold text-white">{initials}</span>}
            <h2 className="mt-5 text-2xl">{profile.name || "Your name"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.bio || "Your profile introduction will appear here."}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Globe2 className="size-3.5 text-brand-green" />/{profile.username || "username"}</div>
            <div className="mt-6 space-y-3 border-t pt-5">
              {eventTypes.slice(0, 3).map((eventType) => <div key={eventType.title} className="flex items-center justify-between rounded-button border p-3"><span className="text-sm font-medium">{eventType.title}</span><span className="text-xs text-muted-foreground">{eventType.durationMinutes} min</span></div>)}
              {eventTypes.length === 0 && <div className="flex items-center gap-3 rounded-button border border-dashed p-4 text-sm text-muted-foreground"><UserRound className="size-4" />Active event types appear here.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

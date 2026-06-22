"use client";

import { CalendarDays, CalendarOff, Clock3, Route, Search, UserRound, UsersRound, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const sections = [
  {
    title: "Personal settings",
    items: [
      { title: "Profile", description: "Manage your public identity and booking profile", href: "/dashboard/settings/profile", icon: UserRound },
      { title: "General", description: "Set timezone, language, time format, and week start", href: "/dashboard/settings/general", icon: Clock3 },
      { title: "Calendars", description: "Connect and manage calendar conflict checks", href: "/dashboard/settings/calendars", icon: CalendarDays },
      { title: "Out of office", description: "Block dates when you are away", href: "/dashboard/settings/out-of-office", icon: CalendarOff },
    ],
  },
  {
    title: "Scheduling tools",
    items: [
      { title: "Teams", description: "Manage hosts and collaborative scheduling", href: "/dashboard/teams", icon: UsersRound },
      { title: "Routing", description: "Guide invitees to the right event type", href: "/dashboard/routing", icon: Route },
      { title: "Workflows", description: "Automate reminders and follow-up messages", href: "/dashboard/workflows", icon: Zap },
    ],
  },
];

export function SettingsHub() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery)),
  })).filter((section) => section.items.length), [normalizedQuery]);

  return (
    <>
      <label className="relative mt-7 block max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input className="ip-input pl-11" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings" aria-label="Search settings" />
      </label>

      <div className="mt-9 space-y-10">
        {filteredSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl">{section.title}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group flex gap-4 rounded-[22px] border border-black/[0.07] bg-white p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-[0_16px_36px_rgba(29,32,27,.08)]">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[#151613] text-primary transition-colors group-hover:bg-primary group-hover:text-[#151613]">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">{item.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-muted-foreground">{item.description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 && <div className="rounded-card border border-dashed p-10 text-center text-sm text-muted-foreground">No settings match “{query}”.</div>}
      </div>
    </>
  );
}

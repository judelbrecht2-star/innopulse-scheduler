"use client";

import { CalendarDays, CalendarRange, Clock3, LayoutDashboard, Route, Settings2, UsersRound, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Event types", href: "/dashboard/event-types", icon: CalendarRange },
  { label: "Teams", href: "/dashboard/teams", icon: UsersRound },
  { label: "Routing", href: "/dashboard/routing", icon: Route },
  { label: "Workflows", href: "/dashboard/workflows", icon: Zap },
  { label: "Availability", href: "/dashboard/availability", icon: Clock3 },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
];

function NavigationLink({ label, href, icon: Icon, compact = false }: (typeof navigation)[number] & { compact?: boolean }) {
  const pathname = usePathname();
  const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(
      "group flex items-center gap-3 rounded-[18px] text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-200",
      compact ? "min-w-[72px] flex-col gap-1.5 px-2 py-2 text-[10px]" : "px-3.5 py-3",
      active
        ? "bg-[#151613] text-white shadow-[0_10px_24px_rgba(21,22,19,.18)]"
        : "text-[#6c7068] hover:translate-x-0.5 hover:bg-[#eef0eb] hover:text-[#151613]",
    )}>
      <Icon className={cn("size-4.5 transition-colors", active ? "text-primary" : "text-[#777b73] group-hover:text-[#151613]")} />{label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <>
      <aside className="hidden w-[224px] shrink-0 flex-col border-r border-black/[0.07] bg-white px-4 py-5 lg:flex">
        <div className="rounded-[22px] border border-black/[0.06] bg-[#f7f8f4] p-3"><BrandMark /></div>
        <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969b92]">Workspace</p>
        <nav className="space-y-1.5">{navigation.map((item) => <NavigationLink key={item.href} {...item} />)}</nav>
        <div className="mt-auto rounded-[20px] bg-[#eef0eb] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold"><span className="size-2 rounded-full bg-primary shadow-[0_0_0_5px_rgba(200,255,71,.22)]" />System ready</div>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Calendars and booking pages are active.</p>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-start gap-1 overflow-x-auto border-t border-black/[0.08] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">
        {navigation.map((item) => <NavigationLink key={item.href} {...item} compact />)}
      </nav>
    </>
  );
}

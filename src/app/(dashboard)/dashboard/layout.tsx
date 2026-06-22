import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, MapPin } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const initials = (session.user.name ?? session.user.email ?? "IP")
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dashboard-shell pb-16 lg:pb-0">
      <div className="dashboard-frame flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between border-b border-black/[0.07] bg-[#f7f8f4]/90 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-16 items-center justify-center rounded-[12px] border border-black/[0.06] bg-white p-1.5 shadow-[0_5px_16px_rgba(29,32,27,.06)] lg:hidden">
              <Image src="/branding/innopulse-growth-arrows.png" alt="" width={647} height={385} className="h-full w-full object-contain" priority />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">InnoPulse workspace</p>
              <p className="mt-1 text-sm font-semibold">Scheduling command centre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-pill border border-black/[0.07] bg-white px-3 py-2 text-xs text-muted-foreground sm:inline-flex">
              <MapPin className="size-3.5 text-brand-green" />{session.user.timeZone}
            </span>
            <span className="hidden items-center gap-2 rounded-pill border border-black/[0.07] bg-white px-3 py-2 text-xs font-medium md:inline-flex">
              <CalendarDays className="size-3.5" />{formatInTimeZone(new Date(), session.user.timeZone, "EEE, d MMM")}
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#151613] text-xs font-semibold text-white">{initials}</span>
          </div>
          </header>
          <div className="dashboard-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

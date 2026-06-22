import { ArrowRight, ArrowUpRight, CalendarCheck2, Check, Clock3, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const foundations = [
  {
    icon: Globe2,
    number: "01",
    title: "Timezone-safe",
    copy: "Every invitee sees availability in their local timezone while bookings remain safely stored in UTC.",
  },
  {
    icon: CalendarCheck2,
    number: "02",
    title: "Calendar-aware",
    copy: "Connected calendars protect busy time and create the right meeting details automatically.",
  },
  {
    icon: Clock3,
    number: "03",
    title: "Conflict-protected",
    copy: "Availability, notice periods, buffers, and existing bookings are checked before confirmation.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#e8ebe7] p-3 text-[#151613] sm:p-5 lg:p-7">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1540px] overflow-hidden rounded-[30px] border border-white/80 bg-[#f7f8f4] shadow-[0_28px_80px_rgba(32,36,30,.13)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.07] bg-white/75 px-5 py-4 backdrop-blur-xl md:px-8">
          <BrandMark />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-pill border border-black/[0.07] bg-[#eef0eb] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c7068] sm:inline-flex">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_0_5px_rgba(168,230,23,.18)]" />Scheduling platform
            </span>
            <Link href="/login" className="rounded-pill bg-[#151613] px-4 py-2.5 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5">Host sign in</Link>
          </div>
        </header>

        <section className="grid border-b border-black/[0.07] xl:grid-cols-[minmax(0,1.05fr)_minmax(480px,.95fr)]">
          <div className="flex min-h-[620px] flex-col justify-between p-6 sm:p-10 lg:p-14">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7068]"><span className="size-2 rounded-[3px] bg-primary" />InnoPulse scheduling</div>
              <h1 className="mt-8 max-w-[10ch] text-[clamp(3.8rem,8.5vw,8.6rem)] font-semibold leading-[0.84] tracking-[-0.085em]">
                Better meetings start here<span className="text-primary">.</span>
              </h1>
              <p className="mt-9 max-w-xl text-base leading-7 text-[#6c7068] sm:text-lg">A white-labelled scheduling workspace that protects your calendar, respects every timezone, and helps each client arrive prepared.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3.5 text-sm font-semibold text-[#151613] shadow-[0_10px_28px_rgba(168,230,23,.28)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(168,230,23,.4)]">Open dashboard <ArrowRight className="size-4" /></Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-pill border border-black/[0.1] bg-white px-5 py-3.5 text-sm font-semibold transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-green">Connect an account <ArrowUpRight className="size-4" /></Link>
              </div>
            </div>

            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-3 border-t border-black/[0.08] pt-6">
              {["Local time display", "Live conflict checks", "Automatic Meet links"].map((item) => <div key={item} className="text-xs leading-5 text-[#6c7068]"><Check className="mb-2 size-4 text-brand-green" />{item}</div>)}
            </div>
          </div>

          <div className="relative min-h-[560px] border-t border-black/[0.07] bg-[#eef0eb] p-5 sm:p-8 xl:min-h-0 xl:border-l xl:border-t-0">
            <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[28px] bg-[#151613] p-6 text-white shadow-[0_24px_60px_rgba(21,22,19,.22)] sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45"><span className="size-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(168,230,23,.14)]" />Scheduling pulse</div>
                <Sparkles className="size-5 text-primary" />
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-[1fr_160px]">
                <div>
                  <p className="text-sm text-white/45">Next conversation</p>
                  <h2 className="mt-3 max-w-sm text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">Innovation strategy session.</h2>
                </div>
                <div className="rounded-[24px] bg-primary p-5 text-[#151613]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Confirmed</p>
                  <p className="mt-8 text-4xl font-semibold tracking-[-0.06em]">09:00</p>
                  <p className="mt-1 text-xs">Monday · Google Meet</p>
                </div>
              </div>

              <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-3">
                {[{ label: "Timezone", value: "Aligned" }, { label: "Calendar", value: "Protected" }, { label: "Invitee", value: "Prepared" }].map((item) => <div key={item.label} className="rounded-[18px] border border-white/10 bg-white/[0.06] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-white/35">{item.label}</p><p className="mt-2 text-sm font-semibold">{item.value}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7068]">Reliable by design</p><h2 className="mt-3 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">The details are handled before anyone clicks confirm.</h2></div>
            <Link href="/dashboard" className="inline-flex w-fit items-center gap-2 text-sm font-semibold">Explore the workspace <ArrowUpRight className="size-4 text-brand-green" /></Link>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {foundations.map(({ icon: Icon, number, title, copy }) => (
              <article key={title} className="group rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-[0_12px_36px_rgba(29,32,27,.05)] transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand-green/35 hover:shadow-[0_20px_48px_rgba(29,32,27,.09)]">
                <div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-[16px] bg-[#151613] text-primary transition-colors group-hover:bg-primary group-hover:text-[#151613]"><Icon className="size-5" /></span><span className="text-[10px] font-semibold tracking-[0.16em] text-[#92978e]">{number}</span></div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.045em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6c7068]">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="m-3 mt-0 flex flex-col justify-between gap-8 rounded-[26px] bg-primary p-7 sm:m-5 sm:mt-0 sm:flex-row sm:items-end sm:p-10">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Ready when you are</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">Make scheduling feel like part of the experience.</h2></div>
          <Link href="/login" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-pill bg-[#151613] px-5 py-3.5 text-sm font-semibold text-white">Get started <ArrowUpRight className="size-4 text-primary" /></Link>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-7 text-xs text-[#777b73] sm:px-10"><span>InnoPulse by The Growth System</span><span>Professional scheduling infrastructure</span></footer>
      </div>
    </main>
  );
}

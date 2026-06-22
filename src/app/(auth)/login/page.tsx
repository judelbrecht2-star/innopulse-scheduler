import type { Metadata } from "next";
import { CalendarCheck2, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { oauthProviderStatus } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

function InnoPulseLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-4" aria-label="InnoPulse Scheduling home">
      <span className="flex h-[66px] w-[108px] items-center justify-center rounded-panel bg-white p-2 shadow-card">
        <Image src="/branding/innopulse-growth-arrows.png" alt="" width={512} height={305} className="h-full w-full object-contain" priority />
      </span>
      <span><span className={`block text-lg font-semibold leading-5 ${inverted ? "text-white" : "text-foreground"}`}>InnoPulse</span><span className={`mt-1 block text-xs ${inverted ? "text-white/60" : "text-muted-foreground"}`}>by The Growth System</span></span>
    </Link>
  );
}

export default function LoginPage() {
  const providerStatus = oauthProviderStatus();

  return (
    <main className="min-h-screen bg-white md:grid md:grid-cols-[minmax(290px,0.82fr)_minmax(0,1.18fr)]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-secondary p-8 md:flex lg:p-10 xl:p-14">
        <div aria-hidden className="absolute -left-28 top-1/3 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -right-20 size-80 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative"><InnoPulseLogo inverted /></div>
        <div className="relative max-w-md py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Scheduling infrastructure</p>
          <h1 className="mt-5 text-[clamp(2.6rem,4.4vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-white">Make every conversation count.</h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/65">A focused workspace for managing availability, bookings, client preparation, and follow-through.</p>
          <ul className="mt-9 space-y-3 text-sm text-white/75">
            {['Live calendar conflict protection', 'Automatic Google Meet invitations', 'Structured client follow-up'].map((item) => <li key={item} className="flex items-center gap-3"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>{item}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Private workspace · The Growth System</p>
      </aside>

      <section className="relative flex min-h-screen items-center overflow-hidden bg-background px-5 py-8 sm:px-10 md:px-9 lg:px-14 xl:px-20">
        <div aria-hidden className="absolute right-[-12rem] top-[-10rem] size-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-2xl md:mx-0">
          <div className="mb-12 md:hidden"><InnoPulseLogo /></div>
          <div className="max-w-xl">
            <p className="ip-eyebrow">Secure host access</p>
            <h2 className="text-[clamp(2.2rem,5vw,3.65rem)] font-semibold leading-[1.05] tracking-[-0.045em]">Welcome back.</h2>
            <p className="mb-8 mt-4 max-w-lg text-base leading-7 text-muted-foreground">Sign in to manage your scheduling workspace, upcoming conversations, and client journey.</p>
          </div>

          <SignInButtons {...providerStatus} />

          <div className="mt-8 grid gap-3 border-t pt-6 text-xs text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-green" />OAuth-secured account access</p>
            <p className="flex items-center gap-2 sm:justify-end"><CalendarCheck2 className="size-4 text-brand-green" />Calendar permissions stay under your control</p>
          </div>
        </div>
      </section>
    </main>
  );
}

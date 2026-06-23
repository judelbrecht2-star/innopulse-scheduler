"use client";

import { Building2, KeyRound, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignInButtonsProps {
  googleEnabled: boolean;
  microsoftEnabled: boolean;
  emailEnabled?: boolean;
}

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-9">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function MicrosoftMark() {
  return <span aria-hidden className="grid size-8 grid-cols-2 gap-0.5"><span className="bg-[#f35325]" /><span className="bg-[#81bc06]" /><span className="bg-[#05a6f0]" /><span className="bg-[#ffba08]" /></span>;
}

function ProviderTile({ label, enabled, icon, onClick }: { label: string; enabled: boolean; icon: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className={cn(
      "group relative flex min-h-28 flex-col items-center justify-center gap-3 rounded-panel border bg-white px-4 py-5 text-sm font-medium shadow-[0_4px_14px_rgba(28,36,0,0.05)] transition-[transform,border-color,box-shadow,background-color]",
      enabled ? "hover:-translate-y-0.5 hover:border-brand-green hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25" : "cursor-not-allowed bg-brand-cream/55 text-muted-foreground",
    )}>
      {!enabled && <span className="absolute right-2.5 top-2.5 rounded-pill bg-muted px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Soon</span>}
      {icon}<span>{label}</span>
    </button>
  );
}

export function SignInButtons({ googleEnabled, microsoftEnabled, emailEnabled = false }: SignInButtonsProps) {
  const anyProviderEnabled = googleEnabled || microsoftEnabled || emailEnabled;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const result = await signIn("email", { email: email.trim(), redirect: false, callbackUrl: "/dashboard" });
      setStatus(result?.error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ProviderTile label="Google" enabled={googleEnabled} icon={<GoogleMark />} onClick={() => void signIn("google", { callbackUrl: "/dashboard" })} />
        <ProviderTile label="Microsoft" enabled={microsoftEnabled} icon={<MicrosoftMark />} onClick={() => void signIn("azure-ad", { callbackUrl: "/dashboard" })} />
        <ProviderTile label="Passkey" enabled={false} icon={<KeyRound className="size-8" />} />
        <ProviderTile label="SSO" enabled={false} icon={<Building2 className="size-8" />} />
      </div>

      {!anyProviderEnabled && <p className="mt-4 rounded-button border border-brand-amber/40 bg-brand-amber/10 p-4 text-sm leading-6">Add a sign-in method before continuing.</p>}

      <div className="my-7 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or continue with email</span><span className="h-px flex-1 bg-border" /></div>

      {status === "sent" ? (
        <p className="rounded-button border border-brand-green/50 bg-brand-green/10 p-4 text-sm leading-6">
          Check your inbox &mdash; we sent a secure sign-in link to <strong>{email}</strong>. It expires in 24 hours.
        </p>
      ) : (
        <form onSubmit={handleEmailSignIn}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              disabled={!emailEnabled || status === "sending"}
              value={email}
              onChange={(event) => { setEmail(event.target.value); if (status === "error") setStatus("idle"); }}
              aria-label="Work email address"
              placeholder="Work email address"
              className="ip-input pl-11 pr-24 disabled:cursor-not-allowed disabled:bg-brand-cream/50"
            />
            {!emailEnabled && <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill bg-muted px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</span>}
          </div>
          {status === "error" && <p className="mt-2 text-sm text-red-600">We could not send the link. Check the address and try again.</p>}
          <Button type="submit" disabled={!emailEnabled || status === "sending"} className="mt-3 w-full"><LockKeyhole className="size-4" /> {status === "sending" ? "Sending link…" : "Continue securely"}</Button>
        </form>
      )}
    </div>
  );
}

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import AzureADProvider from "next-auth/providers/azure-ad";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import { ensureGoogleCalendarConnection } from "@/server/calendar/google-calendar";
import { provisionNewHost } from "@/server/users/provision-new-host";
import { emailDeliveryConfigured, sendWorkflowEmail } from "@/server/workflows/email";

const ALLOWED_EMAIL_DOMAINS = ["thegrowthsystem.co.za"];

function isAllowedEmail(email: string | null | undefined) {
  const value = (email ?? "").trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((domain) => value.endsWith("@" + domain));
}

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
            "https://www.googleapis.com/auth/calendar.freebusy",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
        },
      },
    }),
  );
}

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid profile email offline_access Calendars.ReadWrite",
        },
      },
    }),
  );
}

if (emailDeliveryConfigured()) {
  providers.push({
    id: "email",
    type: "email",
    name: "Email",
    server: "",
    from: process.env.EMAIL_FROM,
    maxAge: 24 * 60 * 60,
    options: {},
    async sendVerificationRequest({ identifier, url }: { identifier: string; url: string }) {
      if (!isAllowedEmail(identifier)) return;
      await sendWorkflowEmail({
        to: identifier,
        subject: "Your InnoPulse Scheduler sign-in link",
        text: `Sign in to InnoPulse Scheduler\n\n${url}\n\nThis link expires in 24 hours. If you did not request it, you can ignore this email.`,
        html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;color:#1f2433">
  <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#5f8a00;font-weight:600;margin:0 0 8px">InnoPulse Scheduler</p>
  <h2 style="font-size:22px;font-weight:700;color:#0f1530;margin:0 0 10px">Sign in to your scheduling workspace</h2>
  <p style="color:#555;line-height:1.6;margin:0 0 22px">Click the button below to sign in. This link expires in 24 hours.</p>
  <a href="${url}" style="display:inline-block;background:#0f1530;color:#cdf564;text-decoration:none;font-weight:600;padding:13px 24px;border-radius:10px">Sign in securely</a>
  <p style="color:#888;font-size:12px;line-height:1.6;margin:26px 0 0">If you did not request this, you can safely ignore this email.</p>
</div>`,
      });
    },
  } as unknown as Provider);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "email") {
        return isAllowedEmail(user.email);
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.timeZone = user.timeZone;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await provisionNewHost(user);
    },
    async linkAccount({ user, account }) {
      if (account.provider === "google") await ensureGoogleCalendarConnection(user.id);
    },
  },
};

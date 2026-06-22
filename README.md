# InnoPulse Scheduling

Self-hosted scheduling infrastructure for The Growth System. Phase 1 establishes the database, authentication, timezone model, host provisioning, and InnoPulse UI foundation.

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase and OAuth credentials.
2. Install packages with `pnpm install`.
3. Generate Prisma Client with `pnpm prisma:generate`.
4. Apply migrations with `pnpm prisma:migrate`.
5. Optionally seed the demo host with `pnpm db:seed`.
6. Start the app with `pnpm dev`.

## Time handling rules

- Schedule rules and overrides are local wall-clock values tied to an IANA timezone.
- Booking start, end, and blocked ranges are UTC `TIMESTAMPTZ` values.
- Calendar busy data remains provider-owned and will be queried during slot generation.
- Booking creation must repeat the busy check and rely on the PostgreSQL exclusion constraint as its final guard.

## OAuth callbacks

- Google: `{NEXTAUTH_URL}/api/auth/callback/google`
- Microsoft: `{NEXTAUTH_URL}/api/auth/callback/azure-ad`

Google requires Calendar List read, FreeBusy, and Calendar Events scopes. Microsoft requires `offline_access` and `Calendars.ReadWrite`.

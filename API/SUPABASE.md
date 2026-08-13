# Supabase

**Dashboard:** https://supabase.com/dashboard  
**API settings:** Project → Settings → API  
**SQL editor:** Project → SQL → New query → paste `supabase/schema.sql`

## Keys to copy

| Name | Where it appears | Railway / .env.local |
|---|---|---|
| Project URL | Settings → API → Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | Settings → API → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | Settings → API → `service_role` (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

`NEXT_PUBLIC_*` values are baked into the client at **build time**. Set them on Railway **before** the first production build, then redeploy if you change them.

## Endpoints the app uses

- REST via `@supabase/supabase-js` against `{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`
- Tables: `trips`, `travelers`, `trip_preferences`, `hotel_preferences`, `flight_selections`, `hotel_selections`, `ground_selections`, `activity_selections`, `bookings`

## Code

- Client: `lib/supabase.ts`
- Server reads/writes: `lib/db.ts`
- Schema: `supabase/schema.sql`

Until these keys are real (not placeholders), TripHub falls back to `.data/store.json` locally. That file is ephemeral on Railway — add Supabase before you rely on saved trips in production.

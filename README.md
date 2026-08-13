# TripHub

A single hub to plan a trip — flights, hotels, ground transport, and activities — with an explicit **Confirm** at every decision. The app can research and recommend. It never books, advances, or locks a choice until you click.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `SANDBOX_MODE=true` is on by default, so the full flow works with mock flights/hotels and a local JSON store (`.data/store.json`) until you add Supabase keys.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Paste the project URL and anon key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart the dev server. New trips will write to Supabase instead of the local file.

## Confirmation gates

1. Intake review → **Confirm trip basics and search for flights**
2. Flight detail → Select → **Confirm and continue to hotels**
3. Hotel preferences → **Confirm preferences and show recommendations**
4. Hotel detail → Select → **Confirm and continue**
5. Ground / activities → Select or skip → Confirm
6. Final review checkbox → **Book This Trip** → **Yes, Book It**

## Going live

See the file list at the bottom of this README (or the summary in chat) for which env keys to add and which files contain the live API TODOs.

## Stack

Next.js 14 (App Router), TypeScript, Tailwind, shadcn-style UI, Zod, React Hook Form, Supabase, Resend.

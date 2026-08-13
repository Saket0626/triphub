# TripHub app routes

These are **our** HTTP APIs, served by Next.js. Not third-party.

| Method | Path | What it does | Confirm gate |
|---|---|---|---|
| GET | `/api/health` | Railway health check | — |
| POST | `/api/trips` | Save intake after “Confirm trip basics” | Yes |
| GET | `/api/trips/[id]` | Load a trip bundle | — |
| POST | `/api/flights/search` | Mock or Duffel search | After intake confirm |
| POST | `/api/trips/[id]/flight` | Save chosen flight | Yes |
| POST | `/api/trips/[id]/hotel-preferences` | Save hotel prefs | Yes |
| POST | `/api/hotels/search` | Mock or LiteAPI search | After hotel prefs confirm |
| POST | `/api/trips/[id]/hotel` | Save chosen hotel | Yes |
| POST | `/api/trips/[id]/ground` | Save or skip ground | Yes |
| POST | `/api/trips/[id]/activities` | Save or skip activities | Yes |
| POST | `/api/booking/create` | Stripe Checkout (or mock if no Stripe key) | Final “Yes, Book It” |
| POST | `/api/booking/complete` | Verify Stripe session and write booking | After payment |
| POST | `/api/email/send-confirmation` | Resend itinerary email | After booking |

Pages: `/` → `/trip/new` → `/trip/[id]/flights` → `/hotels` → `/ground` → `/activities` → `/review` → `/confirmation`.

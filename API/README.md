# TripHub API keys, endpoints, and Railway variables

Every third-party API this app uses, where to get credentials, which env vars they map to, and which files consume them. **Never commit real keys.** Put live values in `.env.local` locally and in the Railway service **Variables** tab for production.

Copy `API/env.template` → `.env.local` (local) and into Railway Variables (deploy).

| Provider | Purpose | Env vars | Docs |
|---|---|---|---|
| Supabase | Trips, travelers, preferences, selections, bookings | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | [SUPABASE.md](./SUPABASE.md) |
| Duffel | Live flight search + order creation | `DUFFEL_API_KEY` | [DUFFEL.md](./DUFFEL.md) |
| LiteAPI / Nuitee | Live hotel search (Amadeus replacement) | `LITEAPI_KEY` | [LITEAPI.md](./LITEAPI.md) |
| Viator | Live tours/activities (partner approval) | `VIATOR_API_KEY` | [VIATOR.md](./VIATOR.md) |
| Google Places (New) | Ratings, hours, place still exists | `GOOGLE_PLACES_API_KEY` | [PLACES.md](./PLACES.md) |
| Anthropic | Destination research with web search | `ANTHROPIC_API_KEY` | [ANTHROPIC.md](./ANTHROPIC.md) |
| Loyalty valuations | Cash vs points comparison (no live API) | — | [LOYALTY.md](./LOYALTY.md) |
| Hotelbeds | Alternate hotel inventory (unused) | `HOTELBEDS_API_KEY`, `HOTELBEDS_API_SECRET` | [HOTELBEDS.md](./HOTELBEDS.md) |
| Resend | Confirmation emails | `RESEND_API_KEY`, `EMAIL_FROM` | [RESEND.md](./RESEND.md) |
| Stripe | Card payments (TripHub sandbox, not Resale) | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [STRIPE.md](./STRIPE.md) |
| Railway | Hosting, PORT, public URL | Railway-injected `PORT` + the vars above | [RAILWAY.md](./RAILWAY.md) |

App routes (our own API, not third-party): [APP-ROUTES.md](./APP-ROUTES.md)

## Sandbox vs live

```
SANDBOX_MODE=true
NEXT_PUBLIC_SANDBOX_MODE=true
```

When `true`, flights/hotels/activities/research use mock data. Flip both to `false` only after Duffel, LiteAPI, Viator, Places, Anthropic, Resend, Stripe, and Supabase are filled in.

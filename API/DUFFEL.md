# Duffel (flights)

**Docs:** https://duffel.com/docs/api  
**Dashboard / keys:** https://app.duffel.com → Developers → API keys  
**Offer request:** https://duffel.com/docs/api/offer-requests/create-offer-request  
**Create order:** https://duffel.com/docs/api/orders/create-order

## Key

| Name | Env var | Used when |
|---|---|---|
| API token (test or live) | `DUFFEL_API_KEY` | `SANDBOX_MODE=false` |

Start with a **test** token (`duffel_test_…`). Switch to live only when you are ready to ticket.

## Endpoints the app calls

| Method | URL | Purpose |
|---|---|---|
| POST | `https://api.duffel.com/air/offer_requests?return_offers=true` | Search (`lib/flights.ts`) |
| POST | `https://api.duffel.com/air/orders` | Book — TODO in `app/api/booking/create/route.ts` |

Headers required by Duffel:

```
Authorization: Bearer {DUFFEL_API_KEY}
Duffel-Version: v2
Accept: application/json
Content-Type: application/json
Accept-Encoding: gzip
```

## Code

- Search (gated): `lib/flights.ts` — look for `TODO: Put your Duffel API key`
- Booking (gated): `app/api/booking/create/route.ts` — Duffel order TODO
- App wrapper: `POST /api/flights/search`

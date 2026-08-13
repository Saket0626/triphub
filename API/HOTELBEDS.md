# Hotelbeds (optional hotel inventory)

Use this **instead of** Amadeus if you prefer Hotelbeds. Keys are read today but the live path in `lib/hotels.ts` calls Amadeus. Swap that function when you choose Hotelbeds.

**Signup:** https://developer.hotelbeds.com  
**Docs:** https://developer.hotelbeds.com/documentation/hotels/booking-api/

## Keys

| Name | Env var |
|---|---|
| API Key | `HOTELBEDS_API_KEY` |
| Secret | `HOTELBEDS_API_SECRET` |

Signature for Hotelbeds requests: `SHA256(apiKey + secret + UNIX_timestamp)` sent as `X-Signature`, plus `Api-Key` header.

Typical hosts:

- Test: `https://api.test.hotelbeds.com`
- Live: `https://api.hotelbeds.com`

## Code

- Env wiring: `lib/env.ts`
- Integration TODO sits next to the Amadeus path in `lib/hotels.ts`

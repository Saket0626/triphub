# Hotelbeds (optional hotel inventory)

Hotelbeds is an optional hotel inventory source. TripHub’s live hotel path uses **LiteAPI** (`lib/hotels.ts`). Leave these keys blank unless you switch providers.

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
- Live search currently uses LiteAPI, not Hotelbeds. See [LITEAPI.md](./LITEAPI.md).

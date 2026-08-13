# LiteAPI / Nuitee Connect (Amadeus replacement)

Amadeus self-service shut down 17 Jul 2026. TripHub uses **LiteAPI** for live hotel search.

**Dashboard:** https://connect.nuitee.com  
**Docs:** https://docs.liteapi.travel/reference/post_hotels-rates  
**Signup:** Google, GitHub, or email — no credit card for sandbox

## Key

| Name | Env var |
|---|---|
| Sandbox API key | `LITEAPI_KEY` |

Copy the **sandbox** key first. Production key unlocks after a card is on file.

## Endpoint

| Method | URL | Header |
|---|---|---|
| POST | `https://api.liteapi.travel/v3.0/hotels/rates` | `X-API-Key: {LITEAPI_KEY}` |

## Code

- `lib/hotels.ts` — live path when `SANDBOX_MODE=false`

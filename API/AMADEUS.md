# Amadeus (hotels)

**Docs:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search  
**Keys:** https://developers.amadeus.com → My Self-Service Workspace → your app → API Key / API Secret  
**Auth:** `POST https://test.api.amadeus.com/v1/security/oauth2/token`  
**Hotel offers:** `GET https://test.api.amadeus.com/v3/shopping/hotel-offers`

For production inventory, switch the host from `test.api.amadeus.com` to `api.amadeus.com` after Amadeus approves live access.

## Keys

| Name | Env var |
|---|---|
| API Key (client id) | `AMADEUS_API_KEY` |
| API Secret (client secret) | `AMADEUS_API_SECRET` |

## Endpoints the app calls

| Method | URL | Purpose |
|---|---|---|
| POST | `https://test.api.amadeus.com/v1/security/oauth2/token` | OAuth client_credentials |
| GET | `https://test.api.amadeus.com/v3/shopping/hotel-offers` | Hotel search |
| (TODO) | Amadeus Hotel Booking API | Live booking in `app/api/booking/create/route.ts` |

## Code

- Search (gated): `lib/hotels.ts` — `TODO: Put your Amadeus API key`
- App wrapper: `POST /api/hotels/search`

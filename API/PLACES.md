# Google Places API (New)

On-the-ground detail for hotels and activities: ratings, current hours, whether the place is still operating.

**Enable the API:** https://console.cloud.google.com/apis/library/places.googleapis.com  
**Create a key:** https://console.cloud.google.com/google/maps-apis/credentials  
**Docs:** https://developers.google.com/maps/documentation/places/web-service/text-search  
**Env:** `GOOGLE_PLACES_API_KEY`

Billing must be enabled on the Google Cloud project. Places has a monthly free quota, then per-request charges.

## What we call

`POST https://places.googleapis.com/v1/places:searchText`

Headers:

- `X-Goog-Api-Key`
- `X-Goog-FieldMask: places.id,places.displayName,places.rating,places.userRatingCount,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours`

Code: `lib/places.ts`. Mock snapshots while `SANDBOX_MODE=true` or the key is missing.

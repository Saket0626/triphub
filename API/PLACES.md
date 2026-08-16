# Geoapify (Google Places replacement)

On-the-ground detail for hotels and activities: whether the place still maps, OSM opening hours when tagged. **No credit card.** Free plan is 3,000 credits/day and allows commercial use with attribution.

**Sign up (free):** https://www.geoapify.com/  
**Keys:** https://myprojects.geoapify.com/  
**Geocoding docs:** https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/  
**Env:** `GEOAPIFY_API_KEY`

Do not enable Google Cloud billing. Geoapify is OSM-based, so you get hours and existence — not Google star ratings. Hotel/activity ratings still come from LiteAPI and Viator.

## What we call

`GET https://api.geoapify.com/v1/geocode/search?text=…&limit=1&format=json&apiKey=…`

Code: `lib/places.ts`. Mock snapshots while `SANDBOX_MODE=true` or the key is missing.

Free-plan attribution: “Powered by Geoapify” (and OpenStreetMap) wherever this data is shown.

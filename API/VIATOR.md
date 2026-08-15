# Viator Partner API

Activities/tours inventory. **Not self-serve.** Tripadvisor has to approve a partner account before they issue an API key. Until then, TripHub uses Viator-shaped mocks behind `SANDBOX_MODE=true`.

**Apply:** https://partners.viator.com/signup  
**Docs:** https://docs.viator.com/partner-api/technical/  
**Env:** `VIATOR_API_KEY`

## What we call

- `POST https://api.viator.com/partner/search/freetext` — destination lookup (`searchTypes: ["DESTINATIONS"]`)
- `POST https://api.viator.com/partner/products/search` — bookable product summaries
- Header: `exp-api-key`
- `Accept: application/json;version=2.0`

Code: `lib/viator.ts`, used from `lib/activities.ts` when `SANDBOX_MODE=false` and the key is real.

Optional: `VIATOR_API_BASE` if they give you a sandbox host instead of `https://api.viator.com/partner`.

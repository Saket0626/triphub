# Stripe (payments — live booking only)

**Dashboard keys:** https://dashboard.stripe.com/apikeys  
**Docs:** https://docs.stripe.com/payments

## Key

| Name | Env var |
|---|---|
| Secret key (test: `sk_test_…`, live: `sk_live_…`) | `STRIPE_SECRET_KEY` |

Use test keys until `SANDBOX_MODE=false` and Duffel/Amadeus bookings are real.

## Where it plugs in

`app/api/booking/create/route.ts` — TODO: charge the traveler with Stripe before confirming the Duffel order.

No Stripe call runs while `SANDBOX_MODE=true`.

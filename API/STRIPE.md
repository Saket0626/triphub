# Stripe (TripHub sandbox — not Resale)

TripHub uses its **own** Stripe sandbox (`acct_1U3oT45uJAiUQanM`), not the Resale account.

**Dashboard:** https://dashboard.stripe.com  
**Test card:** `4242 4242 4242 4242` · any future expiry · any CVC

## Keys

| Name | Env var |
|---|---|
| Secret key | `STRIPE_SECRET_KEY` |
| Publishable key | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Public app URL | `APP_URL` |

## Flow

1. Traveler checks the review box and confirms.
2. `POST /api/booking/create` opens Stripe Checkout for the trip total.
3. Success returns to `/trip/[id]/confirmation?session_id=…`, which verifies payment and writes the booking.
4. Cancel returns to `/trip/[id]/review?canceled=1` with nothing booked.

No charge runs if `STRIPE_SECRET_KEY` is missing (sandbox mock booking only).

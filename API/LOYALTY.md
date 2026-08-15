# Loyalty points wallet

There is **no live API** for “what are my points worth.” TripHub stores balances the traveler types in, then compares cash vs points using a hand-maintained cents-per-point table.

**Table:** `lib/loyalty.ts` → `CENTS_PER_POINT`  
**UI:** Travelers step (wallet) + flight/hotel cards (`PointsCompare`)

Valuations are approximate public figures (typical published cents-per-point charts). They should be updated by hand when those charts move. We never redeem or deduct points — the box is decision support only.

Schema: `loyalty_wallets` in `supabase/schema.sql` / `supabase/add-research-loyalty.sql`.

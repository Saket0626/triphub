/** TripHub Stripe client — dedicated sandbox, not the Resale account. */

import Stripe from "stripe";
import { env, isPlaceholder } from "@/lib/env";

let client: Stripe | null = null;

export function isStripeConfigured() {
  const key = env.stripeSecretKey;
  if (!key || isPlaceholder(key)) return false;
  return /^(sk_test_|sk_live_|rk_test_|rk_live_|rkcs_test_)/.test(key);
}

export function getStripe() {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is missing. Add the TripHub Stripe test key to .env.local.");
  }
  if (!client) {
    client = new Stripe(env.stripeSecretKey);
  }
  return client;
}

export function requestOrigin(request: Request) {
  const fromEnv = env.appUrl.replace(/\/$/, "");
  const header = request.headers.get("origin") || request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (header?.startsWith("http")) return header.replace(/\/$/, "");
  if (header) return `${proto}://${header}`.replace(/\/$/, "");
  return fromEnv || "http://localhost:3000";
}

/** Finalize a trip after Stripe Checkout succeeds. Idempotent if already booked. */

import { NextResponse } from "next/server";
import { finalizeTripBooking } from "@/lib/booking";
import { getTripBundle } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { sessionId, tripId } = (await request.json()) as {
      sessionId?: string;
      tripId?: string;
    };
    if (!sessionId || !tripId) {
      return NextResponse.json({ error: "Missing sessionId or tripId" }, { status: 400 });
    }

    const existing = await getTripBundle(tripId);
    if (existing?.booking) {
      return NextResponse.json({ booking: existing.booking, alreadyBooked: true });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.tripId !== tripId && session.client_reference_id !== tripId) {
      return NextResponse.json({ error: "Stripe session does not match this trip" }, { status: 400 });
    }
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Payment is not complete yet" }, { status: 400 });
    }

    const booking = await finalizeTripBooking(tripId, sessionId);
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Start booking: Stripe Checkout when keys are set, otherwise sandbox mock. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizeTripBooking } from "@/lib/booking";
import { getTripBundle } from "@/lib/db";
import { getStripe, isStripeConfigured, requestOrigin } from "@/lib/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  tripId: z.string().min(1),
  reviewed: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    if (bundle.booking) {
      return NextResponse.json({ booking: bundle.booking, alreadyBooked: true });
    }
    if (!bundle.flightSelection || !bundle.hotelSelection) {
      return NextResponse.json({ error: "Flight and hotel must be confirmed first" }, { status: 400 });
    }

    if (isStripeConfigured()) {
      const flight = bundle.flightSelection.offer;
      const hotel = bundle.hotelSelection.offer;
      const ground =
        bundle.groundSelection?.choice === "yes" ? bundle.groundSelection.option : null;
      const activities = bundle.activitySelection?.skipped
        ? []
        : bundle.activitySelection?.options ?? [];
      const totalPrice =
        flight.totalPrice +
        hotel.totalPrice +
        (ground?.priceEstimate ?? 0) +
        activities.reduce((s, a) => s + a.totalPrice, 0);
      const amount = Math.max(50, Math.round(totalPrice * 100));
      const origin = requestOrigin(request);
      const destination = bundle.trip.destinationLabel.split("(")[0].trim();

      const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: bundle.trip.contactEmail,
        client_reference_id: tripId,
        metadata: { tripId },
        success_url: `${origin}/trip/${tripId}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/trip/${tripId}/review?canceled=1`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: `TripHub trip to ${destination}`,
                description: `${flight.airline} ${flight.flightNumber} · ${hotel.name}`,
              },
            },
          },
        ],
      });

      if (!session.url) {
        throw new Error("Stripe Checkout did not return a payment URL.");
      }
      return NextResponse.json({ checkoutUrl: session.url });
    }

    const booking = await finalizeTripBooking(tripId);
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

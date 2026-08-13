/** Create a booking after the final confirmation gate. Sandbox simulates processing; live mode is TODO. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking, getTripBundle } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { generateConfirmationNumber } from "@/lib/utils";
import type { ItinerarySnapshot } from "@/types";

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

    if (env.sandboxMode) {
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      // TODO: Create a Duffel order with the selected offer id (DUFFEL_API_KEY).
      // POST https://api.duffel.com/air/orders  — see https://duffel.com/docs/api/orders/create-order
      // TODO: Charge the traveler with Stripe (STRIPE_SECRET_KEY) before confirming the order.
      // TODO: Confirm the hotel booking with Amadeus Hotel Booking or Hotelbeds Booking API.
    }

    const flight = bundle.flightSelection.offer;
    const hotel = bundle.hotelSelection.offer;
    const ground = bundle.groundSelection?.choice === "yes" ? bundle.groundSelection.option : null;
    const activities = bundle.activitySelection?.skipped ? [] : bundle.activitySelection?.options ?? [];
    const totalPrice =
      flight.totalPrice +
      hotel.totalPrice +
      (ground?.priceEstimate ?? 0) +
      activities.reduce((s, a) => s + a.totalPrice, 0);

    const itinerarySnapshot: ItinerarySnapshot = {
      trip: bundle.trip,
      travelers: bundle.travelers,
      flight,
      hotel,
      ground,
      activities,
      totalPrice,
    };

    const booking = await createBooking(tripId, {
      tripId,
      confirmationNumber: generateConfirmationNumber(),
      totalPrice,
      currency: "USD",
      sandbox: env.sandboxMode,
      itinerarySnapshot,
      createdAt: new Date().toISOString(),
    });

    try {
      await sendConfirmationEmail(booking, bundle.trip.contactEmail);
    } catch (emailError) {
      console.error("Confirmation email failed", emailError);
    }

    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

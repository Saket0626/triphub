/** Shared booking finalization used after Stripe payment (or sandbox skip). */

import { createBooking, getTripBundle } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { generateConfirmationNumber } from "@/lib/utils";
import type { ItinerarySnapshot } from "@/types";

export async function finalizeTripBooking(tripId: string, stripeSessionId?: string) {
  const bundle = await getTripBundle(tripId);
  if (!bundle) throw new Error("Trip not found");
  if (bundle.booking) return bundle.booking;
  if (!bundle.flightSelection || !bundle.hotelSelection) {
    throw new Error("Flight and hotel must be confirmed first");
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
    stripeCheckoutSessionId: stripeSessionId,
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

  return booking;
}

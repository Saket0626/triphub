/**
 * Flight search client.
 * SANDBOX_MODE=true → mock generator.
 * SANDBOX_MODE=false → Duffel Offer Requests + Offers.
 *
 * TODO: Put your Duffel API key in .env.local as DUFFEL_API_KEY
 * (Duffel dashboard → Developers → API keys). Never commit the live key.
 * Docs: https://duffel.com/docs/api/offer-requests/create-offer-request
 */

import { env } from "@/lib/env";
import { generateMockFlights } from "@/lib/mock-flights";
import type { FlightOption, Trip, TripPreferences } from "@/types";

export async function searchFlights(trip: Trip, prefs: TripPreferences): Promise<FlightOption[]> {
  if (env.sandboxMode) {
    await new Promise((r) => setTimeout(r, 900));
    return generateMockFlights(trip, prefs);
  }

  return searchDuffel(trip, prefs);
}

async function searchDuffel(trip: Trip, prefs: TripPreferences): Promise<FlightOption[]> {
  // TODO: DUFFEL_API_KEY is read here. Replace the placeholder in .env.local,
  // set SANDBOX_MODE=false, then this function will create an offer request.
  const key = env.duffelApiKey;
  if (!key || key.includes("duffel_test_or_live")) {
    throw new Error("DUFFEL_API_KEY is missing. Add it to .env.local to search live flights.");
  }

  const slices = [
    {
      origin: trip.departureCode,
      destination: trip.destinationCode,
      departure_date: trip.departureDate,
    },
  ];
  if (trip.tripType === "round_trip" && trip.returnDate) {
    slices.push({
      origin: trip.destinationCode,
      destination: trip.departureCode,
      departure_date: trip.returnDate,
    });
  }

  const cabinMap: Record<TripPreferences["cabinClass"], string> = {
    economy: "economy",
    premium_economy: "premium_economy",
    business: "business",
    first: "first",
  };

  const response = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true", {
    method: "POST",
    headers: {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      data: {
        slices,
        passengers: [
          ...Array.from({ length: trip.adultCount }, () => ({ type: "adult" })),
          ...Array.from({ length: trip.childCount }, () => ({ type: "child" })),
        ],
        cabin_class: cabinMap[prefs.cabinClass],
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Duffel search failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    data?: { offers?: Array<Record<string, unknown>> };
  };
  const offers = json.data?.offers ?? [];
  return offers.slice(0, 12).map((offer) => mapDuffelOffer(offer, prefs, trip));
}

function mapDuffelOffer(
  offer: Record<string, unknown>,
  prefs: TripPreferences,
  trip: Trip
): FlightOption {
  const slices = (offer.slices as Array<Record<string, unknown>> | undefined) ?? [];
  const outbound = (slices[0]?.segments as Array<Record<string, unknown>> | undefined) ?? [];
  const first = outbound[0] ?? {};
  const last = outbound[outbound.length - 1] ?? first;
  const owner = (offer.owner as Record<string, unknown>) ?? {};
  const total = Number(offer.total_amount ?? 0);
  const travelers = trip.adultCount + trip.childCount || 1;

  return {
    id: String(offer.id ?? crypto.randomUUID()),
    airline: String(owner.name ?? "Airline"),
    airlineCode: String(owner.iata_code ?? ""),
    flightNumber: String(first.operating_carrier_flight_number ?? first.marketing_carrier_flight_number ?? ""),
    from: trip.departureCode,
    to: trip.destinationCode,
    departAt: String(first.departing_at ?? `${trip.departureDate}T08:00:00`),
    arriveAt: String(last.arriving_at ?? `${trip.departureDate}T12:00:00`),
    durationMinutes: 180,
    stops: Math.max(0, outbound.length - 1),
    layovers: [],
    segments: outbound.map((seg) => ({
      airline: String((seg.operating_carrier as Record<string, unknown> | undefined)?.name ?? owner.name ?? ""),
      airlineCode: String((seg.operating_carrier as Record<string, unknown> | undefined)?.iata_code ?? ""),
      flightNumber: String(seg.operating_carrier_flight_number ?? ""),
      from: String((seg.origin as Record<string, unknown> | undefined)?.iata_code ?? ""),
      to: String((seg.destination as Record<string, unknown> | undefined)?.iata_code ?? ""),
      departAt: String(seg.departing_at ?? ""),
      arriveAt: String(seg.arriving_at ?? ""),
      durationMinutes: 0,
    })),
    cabinClass: prefs.cabinClass,
    pricePerTraveler: Math.round(total / travelers),
    totalPrice: Math.round(total),
    currency: String(offer.total_currency ?? "USD"),
    bags: { carryOn: "See fare details", checked: "See fare details" },
    fareRules: "Live Duffel fare. Review conditions on the offer before confirming.",
    matchTags: ["Live Duffel offer"],
    score: 50,
  };
}

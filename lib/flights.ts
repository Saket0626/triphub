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
import { collapseFlights, isImplausibleFlight } from "@/lib/flight-realism";
import { addCalendarDays, formatDate, nightsBetween } from "@/lib/utils";
import { updateTripDates } from "@/lib/db";
import type { FlightOption, Trip, TripPreferences } from "@/types";

export type DateSuggestion = {
  departureDate: string;
  returnDate: string | null;
  flightCount: number;
};

export type FlightSearchResult = {
  flights: FlightOption[];
  departureDate: string;
  returnDate: string | null;
  dateAdjusted: boolean;
  originalDepartureDate: string;
  originalReturnDate: string | null;
  dateReason: string | null;
  dateSuggestions: DateSuggestion[];
};

function emptySuggestions(departureDate: string, returnDate: string | null, flightCount: number): DateSuggestion[] {
  return [{ departureDate, returnDate, flightCount }];
}

export async function searchFlights(
  trip: Trip,
  prefs: TripPreferences,
  opts?: { exactDates?: boolean }
): Promise<FlightSearchResult> {
  if (env.sandboxMode) {
    await new Promise((r) => setTimeout(r, 900));
    const flights = generateMockFlights(trip, prefs);
    return {
      flights,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      dateAdjusted: false,
      originalDepartureDate: trip.departureDate,
      originalReturnDate: trip.returnDate,
      dateReason: null,
      dateSuggestions: emptySuggestions(trip.departureDate, trip.returnDate, flights.length),
    };
  }

  if (opts?.exactDates) {
    const flights = await searchDuffel(trip, prefs);
    return {
      flights,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      dateAdjusted: false,
      originalDepartureDate: trip.departureDate,
      originalReturnDate: trip.returnDate,
      dateReason: null,
      dateSuggestions: emptySuggestions(trip.departureDate, trip.returnDate, flights.length),
    };
  }

  return searchDuffelWithDateFallback(trip, prefs);
}

function dateWindows(trip: Trip) {
  const nights = trip.returnDate ? nightsBetween(trip.departureDate, trip.returnDate) : 0;
  const make = (offset: number) => ({
    offset,
    departureDate: addCalendarDays(trip.departureDate, offset),
    returnDate: trip.returnDate ? addCalendarDays(trip.departureDate, offset + nights) : null,
  });
  return [[make(0)], [make(1), make(-1)], [make(2), make(-2)], [make(3), make(4), make(7)], [make(14), make(-3), make(10)]];
}

function rankWindows<T extends { window: { offset: number } }>(rows: T[]) {
  return [...rows].sort((a, b) => Math.abs(a.window.offset) - Math.abs(b.window.offset) || b.window.offset - a.window.offset);
}

async function searchDuffelWithDateFallback(trip: Trip, prefs: TripPreferences): Promise<FlightSearchResult> {
  const originalDepartureDate = trip.departureDate;
  const originalReturnDate = trip.returnDate;
  let lastError = "Duffel did not return real airline offers for this route.";
  const suggestions: DateSuggestion[] = [];

  for (const batch of dateWindows(trip)) {
    const results = await Promise.all(
      batch.map(async (window) => {
        const shifted: Trip = {
          ...trip,
          departureDate: window.departureDate,
          returnDate: window.returnDate,
        };
        try {
          return { window, flights: await searchDuffel(shifted, prefs), error: null as string | null };
        } catch (error) {
          return {
            window,
            flights: [] as FlightOption[],
            error: error instanceof Error ? error.message : lastError,
          };
        }
      })
    );
    const hits = rankWindows(results.filter((row) => row.flights.length));
    for (const row of hits) {
      if (!suggestions.some((s) => s.departureDate === row.window.departureDate && s.returnDate === row.window.returnDate)) {
        suggestions.push({
          departureDate: row.window.departureDate,
          returnDate: row.window.returnDate,
          flightCount: row.flights.length,
        });
      }
    }
    const hit = hits[0];
    if (hit) {
      const dateAdjusted = hit.window.offset !== 0;
      if (dateAdjusted) {
        await updateTripDates(trip.id, hit.window.departureDate, hit.window.returnDate);
      }
      const orig = `${formatDate(originalDepartureDate)}${originalReturnDate ? `–${formatDate(originalReturnDate)}` : ""}`;
      const next = `${formatDate(hit.window.departureDate)}${hit.window.returnDate ? `–${formatDate(hit.window.returnDate)}` : ""}`;
      return {
        flights: hit.flights,
        departureDate: hit.window.departureDate,
        returnDate: hit.window.returnDate,
        dateAdjusted,
        originalDepartureDate,
        originalReturnDate,
        dateReason: dateAdjusted
          ? `No real flights on ${orig}. Suggested dates: ${next}. Showing those flights below.`
          : null,
        dateSuggestions: suggestions,
      };
    }
    lastError = results.map((row) => row.error).find(Boolean) ?? lastError;
  }

  throw new Error(`${lastError} Nearby dates were searched too.`);
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
  const mapped = offers
    .map((offer) => mapDuffelOffer(offer, prefs, trip))
    .filter((flight) => {
      const airline = flight.airline.toLowerCase();
      const code = flight.airlineCode.toUpperCase();
      if (airline.includes("duffel") || code === "ZZ") return false;
      if (!flight.flightNumber) return false;
      if (isImplausibleFlight(flight, trip)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);
  const collapsed = collapseFlights(mapped).slice(0, 80);
  if (!collapsed.length) {
    throw new Error("Duffel did not return real airline offers for this route.");
  }
  return collapsed;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isoDurationMinutes(iso: unknown) {
  if (typeof iso !== "string") return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 60 + Number(match[2] || 0) + Math.round(Number(match[3] || 0) / 60);
}

function mapSlice(slice: Record<string, unknown>, owner: Record<string, unknown>, fallbackFrom: string, fallbackTo: string, fallbackDate: string) {
  const segmentsRaw = (slice.segments as Array<Record<string, unknown>> | undefined) ?? [];
  const first = segmentsRaw[0] ?? {};
  const last = segmentsRaw[segmentsRaw.length - 1] ?? first;
  const marketing = rec(first.marketing_carrier);
  const operating = rec(first.operating_carrier);
  const flightNumber = String(
    first.marketing_carrier_flight_number ??
      first.operating_carrier_flight_number ??
      marketing.iata_code ??
      ""
  );
  const layovers = segmentsRaw.slice(0, -1).map((seg, i) => {
    const next = segmentsRaw[i + 1] ?? {};
    const arrive = Date.parse(String(seg.arriving_at ?? ""));
    const leave = Date.parse(String(next.departing_at ?? ""));
    return {
      airport: String(rec(seg.destination).iata_code ?? ""),
      durationMinutes: Number.isFinite(arrive) && Number.isFinite(leave) ? Math.max(0, Math.round((leave - arrive) / 60000)) : 0,
    };
  });
  const durationMinutes = isoDurationMinutes(slice.duration) || 180;
  return {
    airline: String(operating.name ?? marketing.name ?? owner.name ?? "Airline"),
    airlineCode: String(operating.iata_code ?? marketing.iata_code ?? owner.iata_code ?? ""),
    flightNumber,
    from: String(rec(first.origin).iata_code ?? fallbackFrom),
    to: String(rec(last.destination).iata_code ?? fallbackTo),
    departAt: String(first.departing_at ?? `${fallbackDate}T08:00:00`),
    arriveAt: String(last.arriving_at ?? `${fallbackDate}T12:00:00`),
    durationMinutes,
    stops: Math.max(0, segmentsRaw.length - 1),
    layovers,
    segments: segmentsRaw.map((seg) => {
      const op = rec(seg.operating_carrier);
      const mk = rec(seg.marketing_carrier);
      return {
        airline: String(op.name ?? mk.name ?? owner.name ?? ""),
        airlineCode: String(op.iata_code ?? mk.iata_code ?? ""),
        flightNumber: String(seg.marketing_carrier_flight_number ?? seg.operating_carrier_flight_number ?? ""),
        from: String(rec(seg.origin).iata_code ?? ""),
        to: String(rec(seg.destination).iata_code ?? ""),
        departAt: String(seg.departing_at ?? ""),
        arriveAt: String(seg.arriving_at ?? ""),
        durationMinutes: isoDurationMinutes(seg.duration),
      };
    }),
  };
}

function mapDuffelOffer(
  offer: Record<string, unknown>,
  prefs: TripPreferences,
  trip: Trip
): FlightOption {
  const slices = (offer.slices as Array<Record<string, unknown>> | undefined) ?? [];
  const owner = rec(offer.owner);
  const total = Number(offer.total_amount ?? 0);
  const travelers = trip.adultCount + trip.childCount || 1;
  const outbound = mapSlice(slices[0] ?? {}, owner, trip.departureCode, trip.destinationCode, trip.departureDate);
  const inbound = slices[1]
    ? mapSlice(slices[1], owner, trip.destinationCode, trip.departureCode, trip.returnDate ?? trip.departureDate)
    : undefined;
  const tags = ["Live Duffel offer"];
  if (outbound.stops === 0) tags.push("Nonstop");
  if (prefs.maxStops === "none" && outbound.stops === 0) tags.push("Matches nonstop request");
  const hours = Math.max(1, Math.round(outbound.durationMinutes / 60));
  const recommendReason = [
    outbound.stops === 0 ? "Nonstop" : `${outbound.stops} stop${outbound.stops === 1 ? "" : "s"}`,
    outbound.airline,
    `${hours}h`,
    `$${Math.round(total)}`,
  ].join(" · ");

  return {
    id: String(offer.id ?? crypto.randomUUID()),
    airline: outbound.airline,
    airlineCode: outbound.airlineCode,
    flightNumber: outbound.flightNumber,
    from: outbound.from,
    to: outbound.to,
    departAt: outbound.departAt,
    arriveAt: outbound.arriveAt,
    durationMinutes: outbound.durationMinutes,
    stops: outbound.stops,
    layovers: outbound.layovers,
    segments: outbound.segments,
    returnFlight: inbound
      ? {
          airline: inbound.airline,
          airlineCode: inbound.airlineCode,
          flightNumber: inbound.flightNumber,
          from: inbound.from,
          to: inbound.to,
          departAt: inbound.departAt,
          arriveAt: inbound.arriveAt,
          durationMinutes: inbound.durationMinutes,
          stops: inbound.stops,
          layovers: inbound.layovers,
          segments: inbound.segments,
          cabinClass: prefs.cabinClass,
          pricePerTraveler: Math.round(total / travelers),
          totalPrice: Math.round(total),
          currency: String(offer.total_currency ?? "USD"),
          bags: { carryOn: "See fare details", checked: "See fare details" },
          fareRules: "Live Duffel fare. Review conditions on the offer before confirming.",
          matchTags: tags,
          score: 0,
        }
      : undefined,
    cabinClass: prefs.cabinClass,
    pricePerTraveler: Math.round(total / travelers),
    totalPrice: Math.round(total),
    currency: String(offer.total_currency ?? "USD"),
    bags: { carryOn: "See fare details", checked: "See fare details" },
    fareRules: "Live Duffel fare. Review conditions on the offer before confirming.",
    matchTags: tags,
    score: Math.round(
      8000 / (Math.max(total, 1) / 10) +
        2500 / Math.max(outbound.durationMinutes, 60) +
        (outbound.stops === 0 ? 40 : outbound.stops === 1 ? 12 : 0)
    ),
    recommendReason,
  };
}

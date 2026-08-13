/**
 * Hotel search client.
 * SANDBOX_MODE=true → mock generator.
 * SANDBOX_MODE=false → Amadeus Hotel Search (Hotelbeds leftover keys are read but unused).
 *
 * TODO: Put your Amadeus API key and secret in .env.local as
 * AMADEUS_API_KEY and AMADEUS_API_SECRET
 * (Amadeus for Developers → My Self-Service Workspace → API Key / API Secret).
 * Docs: https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search
 *
 * TODO (alternative): Hotelbeds — HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET
 * if you prefer that inventory instead of Amadeus.
 */

import { env } from "@/lib/env";
import { generateMockHotels } from "@/lib/mock-hotels";
import type { HotelOption, HotelPreferences, Trip } from "@/types";

export async function searchHotels(trip: Trip, prefs: HotelPreferences): Promise<HotelOption[]> {
  if (env.sandboxMode) {
    await new Promise((r) => setTimeout(r, 800));
    return generateMockHotels(trip, prefs);
  }
  return searchAmadeus(trip, prefs);
}

async function searchAmadeus(trip: Trip, prefs: HotelPreferences): Promise<HotelOption[]> {
  // TODO: AMADEUS_API_KEY / AMADEUS_API_SECRET are read here.
  if (!env.amadeusApiKey || env.amadeusApiKey.includes("your_amadeus")) {
    throw new Error("AMADEUS_API_KEY is missing. Add it to .env.local to search live hotels.");
  }

  const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.amadeusApiKey,
      client_secret: env.amadeusApiSecret,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Amadeus auth failed (${tokenRes.status})`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string };

  const city = trip.destinationCode;
  const url = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
  url.searchParams.set("cityCode", city);
  url.searchParams.set("checkInDate", trip.departureDate);
  url.searchParams.set("checkOutDate", trip.returnDate ?? trip.departureDate);
  url.searchParams.set("adults", String(trip.adultCount));
  url.searchParams.set("roomQuantity", String(prefs.rooms));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus hotel search failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const cityName = trip.destinationLabel.split("(")[0].trim();

  return (json.data ?? []).slice(0, 9).map((row) => {
    const hotel = (row.hotel as Record<string, unknown>) ?? {};
    const offers = (row.offers as Array<Record<string, unknown>> | undefined) ?? [];
    const price = Number((offers[0]?.price as Record<string, unknown> | undefined)?.total ?? 200);
    return {
      id: String(hotel.hotelId ?? crypto.randomUUID()),
      name: String(hotel.name ?? "Hotel"),
      stars: Number(hotel.rating ?? 4),
      neighborhood: String((hotel.address as Record<string, unknown> | undefined)?.cityName ?? cityName),
      city: cityName,
      pricePerNight: Math.round(price),
      totalPrice: Math.round(price),
      currency: "USD",
      amenities: [],
      cancellationPolicy: "See live Amadeus offer for cancellation terms.",
      whyItFits: "Live Amadeus result for your dates and destination.",
      photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      photoAlt: String(hotel.name ?? "Hotel"),
    };
  });
}

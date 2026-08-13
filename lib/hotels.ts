/**
 * Hotel search client.
 * SANDBOX_MODE=true → mock generator.
 * SANDBOX_MODE=false → LiteAPI / Nuitee Connect (Amadeus self-service shut down 17 Jul 2026).
 *
 * Put your LiteAPI sandbox key in .env.local as LITEAPI_KEY
 * Dashboard: https://connect.nuitee.com → Profile / API keys
 * Docs: https://docs.liteapi.travel/reference/post_hotels-rates
 */

import { env } from "@/lib/env";
import { generateMockHotels } from "@/lib/mock-hotels";
import { nightsBetween } from "@/lib/utils";
import type { HotelOption, HotelPreferences, Trip } from "@/types";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

type Money = { amount?: number; currency?: string };
type LiteRate = {
  name?: string;
  retailRate?: { total?: Money[] };
  cancellationPolicies?: unknown;
};
type LiteRoomType = { rates?: LiteRate[] };
type LiteRateRow = { hotelId?: string; roomTypes?: LiteRoomType[] };
type LiteHotelMeta = {
  id?: string;
  name?: string;
  main_photo?: string;
  thumbnail?: string;
  address?: string;
  city_name?: string;
  stars?: number;
  rating?: number;
};

export async function searchHotels(trip: Trip, prefs: HotelPreferences): Promise<HotelOption[]> {
  if (env.sandboxMode) {
    await new Promise((r) => setTimeout(r, 800));
    return generateMockHotels(trip, prefs);
  }
  return searchLiteApi(trip, prefs);
}

async function searchLiteApi(trip: Trip, prefs: HotelPreferences): Promise<HotelOption[]> {
  const key = env.liteApiKey;
  if (!key || key.includes("your_liteapi") || key.length < 8) {
    throw new Error("LITEAPI_KEY is missing. Add it to .env.local (Nuitee Connect → API keys).");
  }

  const city = trip.destinationLabel.split("(")[0].trim();
  const checkout = trip.returnDate ?? trip.departureDate;
  const nights = nightsBetween(trip.departureDate, checkout);
  const childrenAges = Array.from({ length: trip.childCount }, () => 8);

  const body: Record<string, unknown> = {
    iataCode: trip.destinationCode,
    checkin: trip.departureDate,
    checkout,
    currency: "USD",
    guestNationality: "US",
    occupancies: [
      {
        rooms: prefs.rooms,
        adults: Math.max(trip.adultCount, 1),
        ...(childrenAges.length ? { children: childrenAges } : {}),
      },
    ],
    timeout: 8,
    maxRatesPerHotel: 1,
    limit: 9,
    includeHotelData: true,
  };
  if (prefs.starRating !== "no_preference") {
    body.starRating = [Number(prefs.starRating)];
  }

  const res = await fetch("https://api.liteapi.travel/v3.0/hotels/rates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LiteAPI hotel search failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    data?: LiteRateRow[];
    hotels?: LiteHotelMeta[];
  };

  const hotelsById = new Map((json.hotels ?? []).map((h) => [String(h.id), h]));

  return (json.data ?? []).slice(0, 9).map((row) => {
    const meta = hotelsById.get(String(row.hotelId)) ?? {};
    const rate = row.roomTypes?.[0]?.rates?.[0];
    const money = rate?.retailRate?.total?.[0];
    const amount = Number(money?.amount ?? 0);
    const perNight =
      nights > 0 ? Math.round(amount / nights) || Math.round(amount) : Math.round(amount);
    const name = String(meta.name ?? "Hotel");
    const stars = Number(meta.stars ?? meta.rating ?? 4);
    const neighborhood = String(meta.city_name ?? meta.address ?? city);
    const photo = String(meta.main_photo || meta.thumbnail || FALLBACK_PHOTO);
    const cancel =
      typeof rate?.cancellationPolicies === "string"
        ? rate.cancellationPolicies
        : "See live LiteAPI offer for cancellation terms.";

    return {
      id: String(row.hotelId ?? crypto.randomUUID()),
      name,
      stars: Number.isFinite(stars) ? stars : 4,
      neighborhood,
      city,
      pricePerNight: perNight || 180,
      totalPrice: Math.round(amount) || perNight * nights,
      currency: String(money?.currency ?? "USD"),
      amenities: [],
      cancellationPolicy: cancel,
      whyItFits: "Live LiteAPI result for your dates and destination.",
      photoUrl: photo,
      photoAlt: name,
    };
  });
}

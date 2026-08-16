/**
 * Geoapify Places / Geocoding — hours, whether a place still maps, OSM tags.
 * Free plan: 3,000 credits/day, no credit card.
 * Docs: https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/
 * Place details: https://apidocs.geoapify.com/docs/place-details/
 *
 * SANDBOX_MODE=true or missing GEOAPIFY_API_KEY → mock snapshots.
 * Google Places is not used (billing account required).
 */

import { env, isPlaceholder } from "@/lib/env";
import type { PlaceSnapshot } from "@/types";

export function isPlacesConfigured() {
  const key = env.geoapifyApiKey;
  return Boolean(key) && key.length > 12 && !isPlaceholder(key) && !key.startsWith("your_");
}

export function isLivePlaces() {
  return !env.sandboxMode && isPlacesConfigured();
}

type GeoapifyHit = {
  place_id?: string;
  name?: string;
  formatted?: string;
  result_type?: string;
  datasource?: { raw?: Record<string, unknown> };
};

function hoursFromRaw(raw?: Record<string, unknown>): string | undefined {
  const hours = raw?.opening_hours;
  return typeof hours === "string" && hours.trim() ? hours.trim() : undefined;
}

function statusFromRaw(raw?: Record<string, unknown>): string {
  if (!raw) return "OPERATIONAL";
  if (raw.disused || raw.abandoned || raw.razed) return "CLOSED";
  return "OPERATIONAL";
}

export function mockPlaceSnapshot(name: string, seedRating = 4.6): PlaceSnapshot {
  const open = !name.toLowerCase().includes("closed");
  return {
    rating: seedRating,
    ratingCount: 80 + (name.length % 400),
    openNow: open,
    hoursSummary: open ? "Open · typical hours 8 AM–10 PM" : "Hours vary",
    businessStatus: "OPERATIONAL",
    source: "mock",
  };
}

export async function lookupPlace(query: string, fallbackRating?: number): Promise<PlaceSnapshot> {
  if (!isLivePlaces()) {
    return mockPlaceSnapshot(query, fallbackRating);
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("apiKey", env.geoapifyApiKey);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return mockPlaceSnapshot(query, fallbackRating);
  }

  const json = (await res.json()) as { results?: GeoapifyHit[] };
  const hit = json.results?.[0];
  if (!hit) {
    return {
      rating: fallbackRating,
      businessStatus: "UNKNOWN",
      hoursSummary: undefined,
      openNow: null,
      source: "geoapify",
    };
  }

  const raw = hit.datasource?.raw;
  return {
    placeId: hit.place_id,
    rating: fallbackRating,
    hoursSummary: hoursFromRaw(raw),
    openNow: null,
    businessStatus: statusFromRaw(raw),
    source: "geoapify",
  };
}

export async function enrichPlaces(queries: string[]): Promise<PlaceSnapshot[]> {
  const limited = queries.slice(0, 8);
  const out: PlaceSnapshot[] = [];
  for (const query of limited) {
    out.push(await lookupPlace(query));
  }
  return out;
}

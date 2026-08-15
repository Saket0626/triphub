/**
 * Google Places API (New) — ratings, hours, whether a place still exists.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 * POST https://places.googleapis.com/v1/places:searchText
 * Headers: X-Goog-Api-Key, X-Goog-FieldMask
 *
 * SANDBOX_MODE=true or missing GOOGLE_PLACES_API_KEY → mock snapshots.
 */

import { env, isPlaceholder } from "@/lib/env";
import type { PlaceSnapshot } from "@/types";

export function isPlacesConfigured() {
  const key = env.googlePlacesApiKey;
  return Boolean(key) && key.length > 12 && !isPlaceholder(key) && !key.startsWith("your_");
}

export function isLivePlaces() {
  return !env.sandboxMode && isPlacesConfigured();
}

type PlaceRow = {
  id?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
};

function snapshotFromPlace(place: PlaceRow | undefined, fallbackRating?: number): PlaceSnapshot {
  const hours = place?.currentOpeningHours ?? place?.regularOpeningHours;
  return {
    placeId: place?.id,
    rating: place?.rating ?? fallbackRating,
    ratingCount: place?.userRatingCount,
    openNow: hours?.openNow ?? null,
    hoursSummary: hours?.weekdayDescriptions?.[0],
    businessStatus: place?.businessStatus ?? "OPERATIONAL",
  };
}

export function mockPlaceSnapshot(name: string, seedRating = 4.6): PlaceSnapshot {
  const open = !name.toLowerCase().includes("closed");
  return {
    rating: seedRating,
    ratingCount: 80 + (name.length % 400),
    openNow: open,
    hoursSummary: open ? "Open · typical hours 8 AM–10 PM" : "Hours vary",
    businessStatus: "OPERATIONAL",
  };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
].join(",");

export async function lookupPlace(query: string, fallbackRating?: number): Promise<PlaceSnapshot> {
  if (!isLivePlaces()) {
    return mockPlaceSnapshot(query, fallbackRating);
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      languageCode: "en",
    }),
  });
  if (!res.ok) {
    return mockPlaceSnapshot(query, fallbackRating);
  }
  const json = (await res.json()) as { places?: PlaceRow[] };
  return snapshotFromPlace(json.places?.[0], fallbackRating);
}

export async function enrichPlaces(queries: string[]): Promise<PlaceSnapshot[]> {
  const limited = queries.slice(0, 8);
  const out: PlaceSnapshot[] = [];
  for (const query of limited) {
    out.push(await lookupPlace(query));
  }
  return out;
}

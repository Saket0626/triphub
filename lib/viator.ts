/**
 * Viator Partner API — activities inventory.
 * Docs: https://docs.viator.com/partner-api/technical/
 * Search: POST https://api.viator.com/partner/products/search
 * Auth header: exp-api-key
 *
 * SANDBOX_MODE=true or missing VIATOR_API_KEY → realistic Viator-shaped mocks.
 */

import { env, isPlaceholder } from "@/lib/env";
import { generateId } from "@/lib/utils";
import { rankActivities } from "@/lib/activity-rank";
import type { ActivityOption, Trip } from "@/types";

const VIATOR_BASE = process.env.VIATOR_API_BASE || "https://api.viator.com/partner";

export function isViatorConfigured() {
  const key = env.viatorApiKey;
  return Boolean(key) && key.length > 8 && !isPlaceholder(key);
}

export function isLiveViator() {
  return !env.sandboxMode && isViatorConfigured();
}

type ViatorMoney = { fromPrice?: number; fromPriceBeforeDiscount?: number };
type ViatorProduct = {
  productCode?: string;
  title?: string;
  description?: string;
  images?: Array<{ variants?: Array<{ url?: string; width?: number; height?: number }> }>;
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number };
  pricing?: { summary?: ViatorMoney };
  flags?: string[];
  productUrl?: string;
  categories?: Array<{ name?: string }>;
};

function minutesToLabel(minutes: number) {
  if (!minutes) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hour${hours === 1 ? "" : "s"}` : `${hours.toFixed(1)} hours`;
}

export function mapViatorProduct(product: ViatorProduct, people: number): ActivityOption {
  const minutes =
    Number(product.duration?.fixedDurationInMinutes ?? product.duration?.variableDurationFromMinutes ?? 0) || 0;
  const price = Math.round(Number(product.pricing?.summary?.fromPrice ?? 0));
  const listPrice = Math.round(Number(product.pricing?.summary?.fromPriceBeforeDiscount ?? 0));
  const name = String(product.title ?? "Activity");
  const photo =
    product.images?.[0]?.variants?.slice().sort((a, b) => Number(b.width ?? 0) - Number(a.width ?? 0))[0]?.url ??
    product.images?.[0]?.variants?.slice(-1)[0]?.url;
  const category = product.categories?.[0]?.name || (product.flags?.includes("SPECIAL_OFFER") ? "Offer" : "Tour");
  const code = String(product.productCode ?? generateId());
  return {
    id: code,
    productCode: product.productCode,
    productUrl: product.productUrl || (product.productCode ? `https://www.viator.com/tours/-/${product.productCode}` : undefined),
    name,
    description: String(product.description ?? "").slice(0, 320) || "Live Viator experience for your dates.",
    duration: minutesToLabel(minutes),
    durationMinutes: minutes || undefined,
    pricePerPerson: price || 0,
    listPrice: listPrice > price ? listPrice : undefined,
    totalPrice: (price || 0) * people,
    category,
    photoUrl: photo,
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
    freeCancellation: product.flags?.includes("FREE_CANCELLATION"),
    source: product.productCode?.startsWith("MOCK-") ? "mock" : "viator",
  };
}

function cityName(label: string) {
  return label.split("(")[0].trim();
}

export function mockViatorProducts(trip: Trip): ViatorProduct[] {
  const city = cityName(trip.destinationLabel);
  const purpose = trip.tripPurpose ?? "vacation";
  const catalog: Record<string, ViatorProduct[]> = {
    vacation: [
      {
        productCode: "MOCK-WALK",
        title: `${city} highlights walking tour`,
        description: "A relaxed 3-hour look at the neighborhoods you'll actually want to hang around in.",
        duration: { fixedDurationInMinutes: 180 },
        pricing: { summary: { fromPrice: 59 } },
        reviews: { combinedAverageRating: 4.8, totalReviews: 2140 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Tour" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-CRUISE",
        title: `Sunset cruise in ${city}`,
        description: "Golden hour from the water with a small group. Drinks on board.",
        duration: { fixedDurationInMinutes: 120 },
        pricing: { summary: { fromPrice: 78, fromPriceBeforeDiscount: 95 } },
        reviews: { combinedAverageRating: 4.7, totalReviews: 980 },
        flags: ["SPECIAL_OFFER", "FREE_CANCELLATION"],
        categories: [{ name: "Cruise" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-FOOD",
        title: `${city} food market tasting`,
        description: "Sample local specialties with a chef-led guide. You won't leave hungry.",
        duration: { fixedDurationInMinutes: 150 },
        pricing: { summary: { fromPrice: 89 } },
        reviews: { combinedAverageRating: 4.9, totalReviews: 1560 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Food" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-MUSEUM",
        title: "Skip-the-line museum tickets",
        description: "Timed entry to the city's most visited museum so you're not in a two-hour line.",
        duration: { variableDurationFromMinutes: 90 },
        pricing: { summary: { fromPrice: 32 } },
        reviews: { combinedAverageRating: 4.5, totalReviews: 4200 },
        categories: [{ name: "Culture" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-DAY",
        title: `Day trip from ${city}`,
        description: "Guided outing with lunch — an easy way to see beyond downtown.",
        duration: { fixedDurationInMinutes: 480 },
        pricing: { summary: { fromPrice: 145 } },
        reviews: { combinedAverageRating: 4.6, totalReviews: 640 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Day trip" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SCUBA-1",
        title: `${city} two-tank scuba dive`,
        description: "Boat dive with a certified guide, tanks, and weights included. Best for Open Water divers.",
        duration: { fixedDurationInMinutes: 300 },
        pricing: { summary: { fromPrice: 149, fromPriceBeforeDiscount: 189 } },
        reviews: { combinedAverageRating: 4.8, totalReviews: 1860 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Scuba diving" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SCUBA-2",
        title: `Discover scuba diving in ${city}`,
        description: "No certification needed. Shallow-water intro with an instructor, gear included.",
        duration: { fixedDurationInMinutes: 180 },
        pricing: { summary: { fromPrice: 129 } },
        reviews: { combinedAverageRating: 4.7, totalReviews: 940 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Scuba diving" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SCUBA-3",
        title: `${city} wreck scuba dive`,
        description: "Advanced wreck site, two tanks, and a small group. Nitrox available.",
        duration: { fixedDurationInMinutes: 360 },
        pricing: { summary: { fromPrice: 219 } },
        reviews: { combinedAverageRating: 4.9, totalReviews: 410 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Scuba diving" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SCUBA-4",
        title: `Night scuba dive in ${city}`,
        description: "Guided night dive with lights. See nocturnal reef life you miss in the day.",
        duration: { fixedDurationInMinutes: 150 },
        pricing: { summary: { fromPrice: 99 } },
        reviews: { combinedAverageRating: 4.6, totalReviews: 280 },
        categories: [{ name: "Scuba diving" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SNORKEL",
        title: `${city} snorkel boat trip`,
        description: "Easier than scuba, same reef. Gear, drinks, and a longer time in the water.",
        duration: { fixedDurationInMinutes: 240 },
        pricing: { summary: { fromPrice: 79, fromPriceBeforeDiscount: 95 } },
        reviews: { combinedAverageRating: 4.5, totalReviews: 2210 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Snorkeling" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-FOOD-2",
        title: `${city} night food crawl`,
        description: "Four stops, seated, not rushed. A local host, not a megaphone.",
        duration: { fixedDurationInMinutes: 210 },
        pricing: { summary: { fromPrice: 95 } },
        reviews: { combinedAverageRating: 4.8, totalReviews: 1320 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Food" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-SUNSET",
        title: `${city} sunset sail`,
        description: "Small-boat sail at golden hour. Drinks on board, no mega-yacht crowd.",
        duration: { fixedDurationInMinutes: 120 },
        pricing: { summary: { fromPrice: 88 } },
        reviews: { combinedAverageRating: 4.7, totalReviews: 760 },
        flags: ["FREE_CANCELLATION"],
        categories: [{ name: "Cruise" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80" }] }],
      },
      {
        productCode: "MOCK-BIKE",
        title: `${city} bike loop half-day`,
        description: "City bikes, helmets, and a suggested loop that actually skips the tourist crush.",
        duration: { fixedDurationInMinutes: 240 },
        pricing: { summary: { fromPrice: 38 } },
        reviews: { combinedAverageRating: 4.4, totalReviews: 510 },
        categories: [{ name: "Outdoors" }],
        images: [{ variants: [{ url: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80" }] }],
      },
    ],
    business: [
      {
        productCode: "MOCK-LOUNGE",
        title: "Airport lounge day pass",
        description: "Quiet workspace, showers, and food between meetings.",
        duration: { fixedDurationInMinutes: 180 },
        pricing: { summary: { fromPrice: 55 } },
        categories: [{ name: "Comfort" }],
        reviews: { combinedAverageRating: 4.4, totalReviews: 210 },
      },
      {
        productCode: "MOCK-DINNER",
        title: "Chef's table near the business district",
        description: "A composed dinner that's useful when you're hosting.",
        duration: { fixedDurationInMinutes: 150 },
        pricing: { summary: { fromPrice: 165 } },
        categories: [{ name: "Dining" }],
        reviews: { combinedAverageRating: 4.8, totalReviews: 88 },
      },
    ],
    family_visit: [
      {
        productCode: "MOCK-ZOO",
        title: `${city} zoo or aquarium tickets`,
        description: "A reliable outing if the weather turns or energy is mixed.",
        duration: { fixedDurationInMinutes: 180 },
        pricing: { summary: { fromPrice: 36 } },
        categories: [{ name: "Family" }],
        reviews: { combinedAverageRating: 4.6, totalReviews: 1100 },
      },
      {
        productCode: "MOCK-COOK",
        title: "Cooking class for mixed ages",
        description: "Hands-on, with stations that work for kids and adults.",
        duration: { fixedDurationInMinutes: 120 },
        pricing: { summary: { fromPrice: 72 } },
        categories: [{ name: "Food" }],
        reviews: { combinedAverageRating: 4.9, totalReviews: 340 },
      },
    ],
    honeymoon: [
      {
        productCode: "MOCK-PHOTO",
        title: "Private golden-hour photo session",
        description: "A local photographer, 45 edited images, the city's prettiest light.",
        duration: { fixedDurationInMinutes: 60 },
        pricing: { summary: { fromPrice: 190 } },
        categories: [{ name: "Photo" }],
        reviews: { combinedAverageRating: 5, totalReviews: 76 },
      },
      {
        productCode: "MOCK-SPA",
        title: "Couples spa afternoon",
        description: "Side-by-side treatment and a quiet room afterwards.",
        duration: { fixedDurationInMinutes: 180 },
        pricing: { summary: { fromPrice: 240 } },
        categories: [{ name: "Wellness" }],
        reviews: { combinedAverageRating: 4.8, totalReviews: 54 },
      },
    ],
    other: [],
  };
  const list = catalog[purpose]?.length ? catalog[purpose] : catalog.vacation;
  return list;
}

async function viatorHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json;version=2.0",
    "Accept-Language": "en-US",
    "exp-api-key": env.viatorApiKey,
  };
}

async function lookupDestinationId(city: string): Promise<string | null> {
  const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
    method: "POST",
    headers: await viatorHeaders(),
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      searchTerm: city,
      searchTypes: [{ searchType: "DESTINATIONS", pagination: { start: 1, count: 5 } }],
      currency: "USD",
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    destinations?:
      | Array<{ destinationId?: number | string; id?: number | string }>
      | { results?: Array<{ destinationId?: number | string; id?: number | string }> };
  };
  const rows = Array.isArray(json.destinations)
    ? json.destinations
    : json.destinations?.results ?? [];
  const first = rows[0];
  const id = first?.destinationId ?? first?.id;
  return id != null ? String(id) : null;
}

export async function searchViatorActivities(
  trip: Trip,
  opts: { query?: string; start?: number; count?: number } = {}
): Promise<{ activities: ActivityOption[]; total: number; live: boolean }> {
  const people = trip.adultCount + trip.childCount;
  const start = opts.start ?? 1;
  const count = Math.min(opts.count ?? 50, 50);

  if (!isLiveViator()) {
    const ranked = rankAndFilter(mockViatorProducts(trip).map((p) => mapViatorProduct(p, people)), opts.query);
    return { activities: ranked, total: ranked.length, live: false };
  }

  const city = cityName(trip.destinationLabel);
  const destinationId = await lookupDestinationId(city);
  if (!destinationId) {
    throw new Error(`Could not find a live Viator destination for ${city}. Try a more specific city name.`);
  }

  const products = opts.query?.trim()
    ? await searchViatorFreetext(opts.query.trim(), destinationId, trip, start, count)
    : await searchViatorCatalog(destinationId, trip, start, count);

  const mapped = products
    .map((p) => mapViatorProduct(p, people))
    .filter((a) => a.pricePerPerson > 0 && a.source === "viator");
  return { activities: rankActivities(mapped), total: mapped.length, live: true };
}

function rankAndFilter(activities: ActivityOption[], query?: string) {
  const tokens = query
    ?.trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const filtered =
    tokens?.length
      ? activities.filter((a) => {
          const hay = `${a.name} ${a.description} ${a.category}`.toLowerCase();
          return tokens.every((token) => hay.includes(token));
        })
      : activities;
  return rankActivities(filtered);
}

async function searchViatorCatalog(destinationId: string, trip: Trip, start: number, count: number) {
  const res = await fetch(`${VIATOR_BASE}/products/search`, {
    method: "POST",
    headers: await viatorHeaders(),
    body: JSON.stringify({
      filtering: {
        destination: destinationId,
        startDate: trip.departureDate,
        endDate: trip.returnDate ?? trip.departureDate,
      },
      sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
      pagination: { start, count },
      currency: "USD",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viator search failed (${res.status}): ${text.slice(0, 240)}`);
  }
  const json = (await res.json()) as { products?: ViatorProduct[]; totalCount?: number };
  return json.products ?? [];
}

async function searchViatorFreetext(
  searchTerm: string,
  destinationId: string,
  trip: Trip,
  start: number,
  count: number
) {
  const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
    method: "POST",
    headers: await viatorHeaders(),
    body: JSON.stringify({
      searchTerm,
      productFiltering: {
        destination: destinationId,
        dateRange: {
          from: trip.departureDate,
          to: trip.returnDate ?? trip.departureDate,
        },
      },
      searchTypes: [{ searchType: "PRODUCTS", pagination: { start, count } }],
      currency: "USD",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viator search failed (${res.status}): ${text.slice(0, 240)}`);
  }
  const json = (await res.json()) as {
    products?: ViatorProduct[] | { results?: ViatorProduct[]; totalCount?: number };
  };
  if (Array.isArray(json.products)) return json.products;
  return json.products?.results ?? [];
}

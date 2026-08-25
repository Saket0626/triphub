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
import { activityMatchesQuery, rankActivities } from "@/lib/activity-rank";
import type { ActivityOption, Trip } from "@/types";

const VIATOR_BASE = process.env.VIATOR_API_BASE || "https://api.viator.com/partner";

export function isViatorConfigured() {
  const key = env.viatorApiKey;
  return Boolean(key) && key.length > 8 && !isPlaceholder(key);
}

export function isLiveViator() {
  return !env.sandboxMode && isViatorConfigured();
}

type ViatorProduct = Record<string, unknown> & {
  productCode?: string;
  title?: string;
  description?: string;
  images?: Array<{ variants?: Array<{ url?: string; width?: number; height?: number }> }>;
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number };
  pricing?: { summary?: { fromPrice?: number; fromPriceBeforeDiscount?: number } };
  flags?: string[];
  productUrl?: string;
  categories?: Array<{ name?: string }>;
};

const DEST_HINTS: Record<string, { id: string; parentId?: string }> = {
  HNL: { id: "59070", parentId: "672" },
  Honolulu: { id: "59070", parentId: "672" },
  Oahu: { id: "672" },
};

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function firstString(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const v = value[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function priceFromBlob(obj: Record<string, unknown>) {
  const blob = JSON.stringify(obj);
  const match = blob.match(/"from[^"]*[Pp]rice":\s*([0-9.]+)/);
  return match ? Number(match[1]) : 0;
}

function minutesToLabel(minutes: number) {
  if (!minutes) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hour${hours === 1 ? "" : "s"}` : `${hours.toFixed(1)} hours`;
}

function productPhoto(product: Record<string, unknown>) {
  const images = (product.images as Array<Record<string, unknown>> | undefined) ?? (product.images as Array<Record<string, unknown>> | undefined) ?? [];
  const variants = (images[0]?.variants as Array<Record<string, unknown>> | undefined) ?? (images[0]?.variants as Array<Record<string, unknown>> | undefined) ?? [];
  const sorted = [...variants].sort((a, b) => Number(b.width ?? 0) - Number(a.width ?? 0));
  return String(sorted[0]?.url ?? variants[variants.length - 1]?.url ?? "") || undefined;
}

export function mapViatorProduct(product: ViatorProduct, people: number): ActivityOption {
  const row = rec(product);
  const pricing = rec(row.pricing);
  const summary = rec(pricing.summary);
  const reviews = rec(row.reviews);
  const duration = rec(row.duration);
  const flags = (Array.isArray(row.flags) ? row.flags : Array.isArray(product.flags) ? product.flags : []).map(String);
  const categories = (Array.isArray(row.categories) ? row.categories : product.categories ?? []) as Array<Record<string, unknown>>;
  const minutes = Math.round(
    firstNumber(duration.fixedDurationInMinutes, duration.fixedDurationInMinutes, duration.variableDurationFromMinutes, duration.variableDurationFromMinutes)
  );
  const price = Math.round(
    firstNumber(summary.fromPrice, summary.fromPrice, pricing.fromPrice, row.fromPrice, priceFromBlob(summary), priceFromBlob(pricing), priceFromBlob(row))
  );
  const listPrice = Math.round(firstNumber(summary.fromPriceBeforeDiscount, summary.fromPriceBeforeDiscount, summary.fromPrice));
  const name = firstString(row, ["title", "title", "name"]) || "Activity";
  const code = firstString(row, ["productCode", "productCode", "id"]) || generateId();
  const url = firstString(row, ["productUrl", "productUrl", "url"]) || (code ? `https://www.viator.com/tours/-/${code}` : undefined);
  const category = String(categories[0]?.name ?? categories[0]?.name ?? (flags.includes("SPECIAL_OFFER") ? "Offer" : "Tour"));
  const rating = firstNumber(reviews.combinedAverageRating, reviews.combinedAverageRating, reviews.averageRating) || undefined;
  const reviewCount = Math.round(firstNumber(reviews.totalReviews, reviews.totalReviews, reviews.reviewCount)) || undefined;
  return {
    id: code,
    productCode: code,
    productUrl: url,
    name,
    description: String(row.description ?? product.description ?? "").slice(0, 320) || "Live Viator experience for your dates.",
    duration: minutesToLabel(minutes),
    durationMinutes: minutes || undefined,
    pricePerPerson: price || 0,
    listPrice: listPrice > price ? listPrice : undefined,
    totalPrice: (price || 0) * people,
    category,
    photoUrl: productPhoto(row),
    rating,
    reviewCount,
    freeCancellation: flags.includes("FREE_CANCELLATION") || flags.includes("FREE_CANCELLATION"),
    source: code.startsWith("MOCK-") || code.startsWith("MOCK-") ? "mock" : "viator",
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
      ...extraWaterMocks(city),
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

function extraWaterMocks(city: string): ViatorProduct[] {
  const photo = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80";
  const rows: Array<{
    code: string;
    title: string;
    description: string;
    minutes: number;
    price: number;
    list?: number;
    rating: number;
    reviews: number;
    category: string;
    cancel?: boolean;
  }> = [
    {
      code: "MOCK-SNORKEL",
      title: `${city} snorkel boat trip`,
      description: "Easier than scuba, same reef. Gear, drinks, and a longer time in the water.",
      minutes: 240,
      price: 79,
      list: 95,
      rating: 4.5,
      reviews: 2210,
      category: "Snorkeling",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-5",
      title: `PADI Discover Scuba Diving in ${city}`,
      description: "Pool briefing then a shallow ocean scuba dive with a PADI instructor. No card required.",
      minutes: 210,
      price: 139,
      rating: 4.8,
      reviews: 1540,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-6",
      title: `${city} two-tank reef scuba diving`,
      description: "Certified divers only. Two tanks, weights, and a small boat to the better reef sites.",
      minutes: 330,
      price: 169,
      list: 199,
      rating: 4.9,
      reviews: 980,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-7",
      title: `${city} shore scuba dive with gear`,
      description: "Beach entry, full gear, and a guide. Good bang for your buck if you already know the area.",
      minutes: 150,
      price: 89,
      rating: 4.4,
      reviews: 410,
      category: "Scuba diving",
    },
    {
      code: "MOCK-SCUBA-8",
      title: `${city} twilight scuba dive`,
      description: "One tank as the light drops. Fish behavior changes and groups stay small.",
      minutes: 120,
      price: 109,
      rating: 4.7,
      reviews: 260,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-9",
      title: `Wreck and reef combo scuba diving in ${city}`,
      description: "Two different sites, two tanks, nitrox option. Most time in the water for the price.",
      minutes: 390,
      price: 229,
      rating: 4.9,
      reviews: 720,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-10",
      title: `${city} beginner scuba diving lesson`,
      description: "Classroom, confined water, then a guided ocean scuba dive. Gear included.",
      minutes: 300,
      price: 159,
      rating: 4.6,
      reviews: 1180,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-11",
      title: `${city} private scuba diving charter`,
      description: "Your group, your sites, two tanks. Highest price, most flexibility.",
      minutes: 360,
      price: 349,
      rating: 5,
      reviews: 88,
      category: "Scuba diving",
    },
    {
      code: "MOCK-SCUBA-12",
      title: `${city} three-tank scuba diving day`,
      description: "Longer boat, three dives, lunch. Best if you want volume in the water.",
      minutes: 480,
      price: 259,
      list: 299,
      rating: 4.8,
      reviews: 540,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-13",
      title: `Night scuba diving in ${city} harbor`,
      description: "Guided night dive with lights. See nocturnal reef life you miss in the day.",
      minutes: 140,
      price: 119,
      rating: 4.5,
      reviews: 190,
      category: "Scuba diving",
    },
    {
      code: "MOCK-SCUBA-14",
      title: `${city} scuba diving plus snorkel combo`,
      description: "Certified divers dive; friends can snorkel the same reef. Efficient for mixed groups.",
      minutes: 300,
      price: 179,
      rating: 4.7,
      reviews: 430,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SCUBA-15",
      title: `${city} introductory scuba diving from shore`,
      description: "Cheapest intro scuba: no boat, still a real dive with an instructor.",
      minutes: 120,
      price: 79,
      rating: 4.3,
      reviews: 760,
      category: "Scuba diving",
      cancel: true,
    },
    {
      code: "MOCK-SNORKEL-2",
      title: `${city} snorkel and sail`,
      description: "Morning snorkel stop, then a sail. Drinks included.",
      minutes: 270,
      price: 99,
      rating: 4.6,
      reviews: 1340,
      category: "Snorkeling",
      cancel: true,
    },
    {
      code: "MOCK-SNORKEL-3",
      title: `${city} guided reef snorkel`,
      description: "Small group, quality gear, a guide in the water pointing out turtles and coral.",
      minutes: 180,
      price: 69,
      rating: 4.8,
      reviews: 2100,
      category: "Snorkeling",
      cancel: true,
    },
  ];
  return rows.map((row) => ({
    productCode: row.code,
    title: row.title,
    description: row.description,
    duration: { fixedDurationInMinutes: row.minutes },
    pricing: { summary: { fromPrice: row.price, fromPriceBeforeDiscount: row.list } },
    reviews: { combinedAverageRating: row.rating, totalReviews: row.reviews },
    flags: row.cancel ? ["FREE_CANCELLATION"] : [],
    categories: [{ name: row.category }],
    images: [{ variants: [{ url: photo }] }],
  }));
}

async function viatorHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json;version=2.0",
    "Accept-Language": "en-US",
    "exp-api-key": env.viatorApiKey,
  };
}

type DestRef = { id: string; parentId?: string };

async function lookupDestination(city: string, airportCode?: string): Promise<DestRef | null> {
  const hinted = DEST_HINTS[airportCode ?? ""] ?? DEST_HINTS[city];
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
  if (!res.ok) return hinted ?? null;
  const json = (await res.json()) as Record<string, unknown>;
  const destBlock = rec(json.destinations);
  const rows = Array.isArray(json.destinations)
    ? (json.destinations as Array<Record<string, unknown>>)
    : ((destBlock.results as Array<Record<string, unknown>> | undefined) ?? []);
  const first = rec(rows[0]);
  const id = first.destinationId ?? first.id ?? first.destinationId;
  const parentId = first.parentDestinationId ?? first.parentDestinationId ?? first.parentId;
  if (id == null) return hinted ?? null;
  return {
    id: String(id),
    parentId: parentId != null ? String(parentId) : hinted?.parentId,
  };
}

function queryVariants(query?: string) {
  if (!query) return [];
  const q = query.toLowerCase();
  if (/\bscuba\b/.test(q) || (/\b(dive|diving)\b/.test(q) && !/snorkel/.test(q))) {
    return ["scuba diving", "scuba", "discover scuba", "PADI dive"];
  }
  return [query];
}

function extractProducts(json: Record<string, unknown>): ViatorProduct[] {
  const products = json.products;
  if (Array.isArray(products)) return products as ViatorProduct[];
  const nested = rec(products);
  if (Array.isArray(nested.results)) return nested.results as ViatorProduct[];
  return [];
}

function productKey(product: ViatorProduct) {
  const row = rec(product);
  return firstString(row, ["productCode", "productCode", "title", "title", "id"]);
}

export async function searchViatorActivities(
  trip: Trip,
  opts: { query?: string; start?: number; count?: number } = {}
): Promise<{ activities: ActivityOption[]; total: number; live: boolean }> {
  const people = trip.adultCount + trip.childCount;
  const query = opts.query?.trim().replace(/[-_]+/g, " ");

  if (!isLiveViator()) {
    const ranked = rankAndFilter(
      mockViatorProducts(trip).map((p) => mapViatorProduct(p, people)),
      query
    );
    return { activities: ranked, total: ranked.length, live: false };
  }

  const city = cityName(trip.destinationLabel);
  const destination = await lookupDestination(city, trip.destinationCode);
  if (!destination) {
    throw new Error(`Could not find a live Viator destination for ${city}. Try a more specific city name.`);
  }

  const products = await fetchViatorPages(destination, trip, query);
  const mapped = dedupeActivities(
    products
      .map((p) => mapViatorProduct(p, people))
      .filter((a) => a.pricePerPerson > 0 && a.source === "viator")
  );
  const ranked = rankAndFilter(mapped, query);
  if (ranked.length === 0) {
    throw new Error(`No live tours came back for ${city}. Try a broader search or nearby dates.`);
  }
  return { activities: ranked, total: ranked.length, live: true };
}

function rankAndFilter(activities: ActivityOption[], query?: string) {
  const filtered = query ? activities.filter((activity) => activityMatchesQuery(activity, query)) : activities;
  return rankActivities(filtered, query);
}

function dedupeActivities(activities: ActivityOption[]) {
  const seen = new Set<string>();
  return activities.filter((activity) => {
    const key = activity.productCode || activity.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchViatorPages(destination: DestRef, trip: Trip, query?: string) {
  const products: ViatorProduct[] = [];
  const seen = new Set<string>();
  const destIds = Array.from(new Set([destination.id, destination.parentId].filter(Boolean))) as string[];
  const variants = queryVariants(query).slice(0, 2);

  async function pull(fetcher: () => Promise<ViatorProduct[]>) {
    try {
      const page = await fetcher();
      for (const product of page) {
        const key = productKey(product);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        products.push(product);
      }
      return page.length;
    } catch {
      return 0;
    }
  }

  const jobs: Array<() => Promise<number>> = [];
  if (query) {
    const terms = variants.length ? variants : [query];
    for (const destId of destIds) {
      for (const term of terms) {
        jobs.push(() => pull(() => searchViatorFreetext(term, destId, trip, 1, 50)));
        jobs.push(() => pull(() => searchViatorFreetext(term, destId, trip, 51, 50)));
      }
    }
    await Promise.all(jobs.map((job) => job()));
    if (products.length >= 8) return products;
  }

  const catalogJobs = destIds.flatMap((destId) => [
    () => pull(() => searchViatorCatalog(destId, trip, 1, 50)),
    () => pull(() => searchViatorCatalog(destId, trip, 51, 50)),
  ]);
  await Promise.all(catalogJobs.map((job) => job()));
  return products;
}

async function searchViatorCatalog(destinationId: string, trip: Trip, start: number, count: number) {
  void trip;
  const dest = Number(destinationId) || destinationId;
  const res = await fetch(`${VIATOR_BASE}/products/search`, {
    method: "POST",
    headers: await viatorHeaders(),
    body: JSON.stringify({
      filtering: { destination: dest },
      sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
      pagination: { start, count },
      currency: "USD",
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];
  return extractProducts(rec(await res.json()));
}

async function searchViatorFreetext(
  searchTerm: string,
  destinationId: string,
  trip: Trip,
  start: number,
  count: number
) {
  void trip;
  const dest = Number(destinationId) || destinationId;
  const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
    method: "POST",
    headers: await viatorHeaders(),
    body: JSON.stringify({
      searchTerm,
      productFiltering: { destination: dest },
      searchTypes: [{ searchType: "PRODUCTS", pagination: { start, count } }],
      currency: "USD",
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];
  const json = rec(await res.json());
  const products = extractProducts(json);
  if (products.length) return products;
  const nested = rec(json.products);
  if (Array.isArray(nested.results)) return nested.results as ViatorProduct[];
  const freetext = rec(json.searchResults ?? json.productResults ?? json);
  for (const key of ["products", "results", "items"]) {
    const rows = freetext[key];
    if (Array.isArray(rows)) return rows as ViatorProduct[];
  }
  return [];
}

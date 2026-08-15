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
  images?: Array<{ variants?: Array<{ url?: string }> }>;
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
  const name = String(product.title ?? "Activity");
  const photo = product.images?.[0]?.variants?.slice(-1)[0]?.url;
  const category = product.categories?.[0]?.name || (product.flags?.includes("SPECIAL_OFFER") ? "Offer" : "Tour");
  return {
    id: String(product.productCode ?? generateId()),
    productCode: product.productCode,
    name,
    description: String(product.description ?? "").slice(0, 280) || "Viator experience for your dates.",
    duration: minutesToLabel(minutes),
    pricePerPerson: price || 59,
    totalPrice: (price || 59) * people,
    category,
    photoUrl: photo,
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
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
    body: JSON.stringify({
      searchTerm: city,
      searchTypes: ["DESTINATIONS"],
      pagination: { start: 1, count: 5 },
      currency: "USD",
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    destinations?: Array<{ destinationId?: number | string; id?: number | string }>;
  };
  const first = json.destinations?.[0];
  const id = first?.destinationId ?? first?.id;
  return id != null ? String(id) : null;
}

export async function searchViatorActivities(trip: Trip): Promise<ActivityOption[]> {
  const people = trip.adultCount + trip.childCount;
  if (!isLiveViator()) {
    return mockViatorProducts(trip).map((p) => mapViatorProduct(p, people));
  }

  const city = cityName(trip.destinationLabel);
  const destinationId = await lookupDestinationId(city);
  const body: Record<string, unknown> = {
    filtering: {
      startDate: trip.departureDate,
      endDate: trip.returnDate ?? trip.departureDate,
      ...(destinationId ? { destination: destinationId } : {}),
    },
    sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" },
    pagination: { start: 1, count: 12 },
    currency: "USD",
  };

  const res = await fetch(`${VIATOR_BASE}/products/search`, {
    method: "POST",
    headers: await viatorHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Viator search failed (${res.status}): ${text.slice(0, 240)}`);
  }
  const json = (await res.json()) as { products?: ViatorProduct[] };
  const products = json.products ?? [];
  if (!products.length) {
    return mockViatorProducts(trip).map((p) => mapViatorProduct(p, people));
  }
  return products.slice(0, 12).map((p) => mapViatorProduct(p, people));
}

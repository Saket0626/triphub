/** Sandbox mock hotel generator — 6–9 realistic properties near the destination. */

import type { HotelOption, HotelPreferences, Trip } from "@/types";
import { generateId, nightsBetween } from "@/lib/utils";
import { HOTEL_MUST_HAVES } from "@/lib/labels";

const PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a308c1a3?auto=format&fit=crop&w=1200&q=80",
];

function cityName(label: string) {
  return label.split("(")[0].trim();
}

export function generateMockHotels(trip: Trip, prefs: HotelPreferences): HotelOption[] {
  const city = cityName(trip.destinationLabel);
  const nights = nightsBetween(trip.departureDate, trip.returnDate);
  const family = trip.childCount > 0 || trip.tripPurpose === "family_visit";
  const honeymoon = trip.tripPurpose === "honeymoon";
  const business = trip.tripPurpose === "business";

  const templates = [
    {
      name: `The ${city} Atelier`,
      stars: 5,
      neighborhood: "City Center",
      price: 420,
      amenities: ["breakfast", "pool", "gym", "free_cancellation", "city_center", "spa"],
    },
    {
      name: `${city} Harbor House`,
      stars: 4,
      neighborhood: "Waterfront",
      price: 285,
      amenities: ["breakfast", "gym", "free_cancellation", "family_friendly"],
    },
    {
      name: `Park Row ${city}`,
      stars: 4,
      neighborhood: "Arts District",
      price: 240,
      amenities: ["gym", "city_center", "pet_friendly", "free_cancellation"],
    },
    {
      name: `Linden Suites ${city}`,
      stars: 3,
      neighborhood: "Midtown",
      price: 168,
      amenities: ["breakfast", "family_friendly", "gym", "free_cancellation"],
    },
    {
      name: `The Marlowe ${city}`,
      stars: 5,
      neighborhood: "Historic Quarter",
      price: 510,
      amenities: ["pool", "spa", "gym", "city_center", "breakfast"],
    },
    {
      name: `${city} Garden Inn`,
      stars: 3,
      neighborhood: "University",
      price: 149,
      amenities: ["breakfast", "pet_friendly", "gym", "family_friendly"],
    },
    {
      name: `Northline Hotel`,
      stars: 4,
      neighborhood: "Financial District",
      price: 310,
      amenities: ["gym", "city_center", "free_cancellation", "breakfast"],
    },
    {
      name: `Oak & Ember Residences`,
      stars: 4,
      neighborhood: "Riverside",
      price: 265,
      amenities: ["pool", "family_friendly", "pet_friendly", "free_cancellation"],
    },
    {
      name: `Sable Court ${city}`,
      stars: 5,
      neighborhood: "Boutique Row",
      price: 390,
      amenities: ["breakfast", "spa", "city_center", "pool", "free_cancellation"],
    },
  ];

  return templates.map((t, i) => {
    let why = `A ${t.stars}-star stay in ${t.neighborhood}, ${city}.`;
    const hits = prefs.mustHaves.filter((m) => t.amenities.includes(m));
    if (hits.length) {
      const labels = hits.map((id) => HOTEL_MUST_HAVES.find((h) => h.id === id)?.label ?? id);
      why = `Matches ${labels.join(", ").toLowerCase()} — and sits in ${t.neighborhood}.`;
    } else if (honeymoon && t.stars >= 5) {
      why = "Quiet, polished, and well suited to a honeymoon stay.";
    } else if (business && t.neighborhood.includes("Financial")) {
      why = "Close to business districts with a reliable gym and workspace.";
    } else if (family && t.amenities.includes("family_friendly")) {
      why = "Family-friendly rooms and amenities that work well with children.";
    }

    let score = 40;
    if (prefs.starRating !== "no_preference" && String(t.stars) === prefs.starRating) score += 20;
    if (t.price >= prefs.budgetMin && t.price <= prefs.budgetMax) score += 18;
    if (t.price < prefs.budgetMin) score -= 8;
    score += hits.length * 8;
    if (t.amenities.includes("city_center") && prefs.mustHaves.includes("city_center")) score += 6;

    return {
      id: generateId(),
      name: t.name,
      stars: t.stars,
      neighborhood: t.neighborhood,
      city,
      pricePerNight: t.price,
      totalPrice: t.price * nights * prefs.rooms,
      currency: "USD",
      amenities: t.amenities,
      cancellationPolicy: t.amenities.includes("free_cancellation")
        ? "Free cancellation until 48 hours before check-in. After that, the first night is charged."
        : "Non-refundable rate. Changes are not permitted after confirmation.",
      whyItFits: why,
      photoUrl: PHOTOS[i % PHOTOS.length],
      photoAlt: `${t.name} exterior`,
      _score: score,
    } as HotelOption & { _score: number };
  })
    .sort((a, b) => ((b as HotelOption & { _score: number })._score - (a as HotelOption & { _score: number })._score))
    .map((hotel) => {
      const { _score, ...rest } = hotel as HotelOption & { _score: number };
      void _score;
      return rest as HotelOption;
    });
}

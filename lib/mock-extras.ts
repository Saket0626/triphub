/** Sandbox mock ground-transport and destination activity suggestions. */

import type { ActivityOption, GroundOption, Trip, TripPurpose } from "@/types";
import { generateId } from "@/lib/utils";

function cityName(label: string) {
  return label.split("(")[0].trim();
}

export function generateGroundOptions(trip: Trip): GroundOption[] {
  const city = cityName(trip.destinationLabel);
  return [
    {
      id: "rideshare",
      kind: "rideshare",
      title: "Rideshare estimate",
      description: `Typical Uber/Lyft fare from ${trip.destinationCode} into ${city}.`,
      priceEstimate: 42,
      details: "Metered, on-demand. No prepayment. Driver pickup at the rideshare lounge.",
    },
    {
      id: "rental_car",
      kind: "rental_car",
      title: "Rental car",
      description: "Compact or midsize from a major on-airport counter.",
      priceEstimate: 68,
      details: "Per day, excluding tolls and insurance. Unlimited mileage. Pickup at airport rental center.",
    },
    {
      id: "private_transfer",
      kind: "private_transfer",
      title: "Pre-booked private transfer",
      description: "Meet-and-greet driver, vehicle sized to your party.",
      priceEstimate: 95,
      details: "Fixed price for the group. 60 minutes of wait time included. Child seats on request.",
    },
    {
      id: "public_transit",
      kind: "public_transit",
      title: "Public transit info",
      description: `Airport rail or bus into ${city} center.`,
      priceEstimate: 12,
      details: "Per adult, one way. Follow airport signs for rail/bus. Travel time typically 25–45 minutes.",
    },
  ];
}

export function generateActivities(trip: Trip): ActivityOption[] {
  const city = cityName(trip.destinationLabel);
  const purpose: TripPurpose = trip.tripPurpose ?? "vacation";
  const people = trip.adultCount + trip.childCount;

  const byPurpose: Record<TripPurpose, Array<Omit<ActivityOption, "id" | "totalPrice">>> = {
    vacation: [
      { name: `${city} highlights walking tour`, description: "A relaxed 3-hour introduction to the neighborhoods you will actually want to linger in.", duration: "3 hours", pricePerPerson: 59, category: "Tour" },
      { name: "Sunset river cruise", description: "Golden-hour views from the water with a small-group boat.", duration: "2 hours", pricePerPerson: 78, category: "Cruise" },
      { name: "Day trip to nearby countryside", description: "Guided outing with lunch — an easy way to see beyond downtown.", duration: "8 hours", pricePerPerson: 145, category: "Day trip" },
      { name: "Food market tasting", description: "Sample local specialties with a chef-led guide.", duration: "2.5 hours", pricePerPerson: 89, category: "Food" },
      { name: "Museum skip-the-line tickets", description: "Timed entry to the city's most visited museum.", duration: "Flexible", pricePerPerson: 32, category: "Culture" },
    ],
    business: [
      { name: "Airport lounge day pass", description: "Quiet workspace, showers, and food between meetings.", duration: "3 hours", pricePerPerson: 55, category: "Comfort" },
      { name: "Private car for meeting day", description: "Driver on call for 8 hours so you are never hunting for a cab.", duration: "8 hours", pricePerPerson: 210, category: "Transport" },
      { name: "Chef's table dinner", description: "A composed dinner near the business district — useful when hosting.", duration: "2.5 hours", pricePerPerson: 165, category: "Dining" },
      { name: "Sunrise run club guest pass", description: "A short, social reset before the workday.", duration: "1 hour", pricePerPerson: 20, category: "Wellness" },
    ],
    family_visit: [
      { name: "Family city scavenger hunt", description: "Self-paced, kid-friendly clues through the center of town.", duration: "2 hours", pricePerPerson: 28, category: "Family" },
      { name: "Zoo or aquarium tickets", description: "A reliable outing if the weather turns or energy is mixed.", duration: "3 hours", pricePerPerson: 36, category: "Family" },
      { name: "Picnic boat rental", description: "Calm water, life jackets included, no experience needed.", duration: "2 hours", pricePerPerson: 48, category: "Outdoors" },
      { name: "Cooking class for mixed ages", description: "Hands-on, with stations that work for children and adults.", duration: "2 hours", pricePerPerson: 72, category: "Food" },
    ],
    honeymoon: [
      { name: "Private golden-hour photo session", description: "A local photographer, 45 edited images, the city's prettiest light.", duration: "1 hour", pricePerPerson: 190, category: "Photo" },
      { name: "Couples spa afternoon", description: "Side-by-side treatment and a quiet room afterwards.", duration: "3 hours", pricePerPerson: 240, category: "Wellness" },
      { name: "Tasting-menu reservation", description: "A sought-after table, booked in your name, nothing prepaid until you confirm.", duration: "3 hours", pricePerPerson: 185, category: "Dining" },
      { name: "Sunrise balloon or overlook", description: "A slow morning with a view — the kind of thing you would not arrange on the fly.", duration: "4 hours", pricePerPerson: 265, category: "Experience" },
    ],
    other: [
      { name: `${city} highlights walking tour`, description: "A clear-eyed overview so you can decide where to spend the rest of the trip.", duration: "3 hours", pricePerPerson: 59, category: "Tour" },
      { name: "Neighborhood food crawl", description: "Four stops, seated, not rushed.", duration: "3 hours", pricePerPerson: 95, category: "Food" },
      { name: "Live music or theater tickets", description: "A vetted evening option near your hotel area.", duration: "2 hours", pricePerPerson: 75, category: "Culture" },
      { name: "Bike rental half-day", description: "City bikes, helmets, and a suggested loop.", duration: "4 hours", pricePerPerson: 38, category: "Outdoors" },
    ],
  };

  const list = byPurpose[purpose].slice(0, 6);
  return list.map((item) => ({
    ...item,
    id: generateId(),
    totalPrice: item.pricePerPerson * people,
  }));
}

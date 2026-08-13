/** Labels and copy helpers used across the trip flow. */

import type { CabinClass, MaxStops, TimeWindow, TripPurpose, TripType } from "@/types";

export const CABIN_NOTES: Record<CabinClass, { label: string; note: string }> = {
  economy: { label: "Economy", note: "typically 1× economy price" },
  premium_economy: { label: "Premium Economy", note: "typically 1.7× economy price" },
  business: { label: "Business", note: "typically 4× economy price" },
  first: { label: "First", note: "typically 6× economy price" },
};

export const AIRLINES = [
  "Delta",
  "United",
  "American",
  "JetBlue",
  "Alaska",
  "Southwest",
  "Hawaiian",
  "Spirit",
] as const;

export const TIME_WINDOWS: { value: TimeWindow; label: string; hours: [number, number] }[] = [
  { value: "early_morning", label: "Early morning", hours: [5, 8] },
  { value: "morning", label: "Morning", hours: [8, 12] },
  { value: "afternoon", label: "Afternoon", hours: [12, 17] },
  { value: "evening", label: "Evening", hours: [17, 21] },
  { value: "red_eye", label: "Red-eye", hours: [21, 5] },
  { value: "no_preference", label: "No preference", hours: [0, 24] },
];

export const STOP_LABELS: Record<MaxStops, string> = {
  none: "Nonstop only",
  one: "Up to 1 stop",
  two_plus: "2+ stops ok",
  no_preference: "No preference",
};

export const PURPOSE_LABELS: Record<TripPurpose, string> = {
  vacation: "Vacation",
  business: "Business",
  family_visit: "Family visit",
  honeymoon: "Honeymoon",
  other: "Other",
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  round_trip: "Round trip",
  one_way: "One-way",
  multi_city: "Multi-city",
};

export const HOTEL_MUST_HAVES = [
  { id: "breakfast", label: "Free breakfast" },
  { id: "pool", label: "Pool" },
  { id: "gym", label: "Gym" },
  { id: "free_cancellation", label: "Free cancellation" },
  { id: "pet_friendly", label: "Pet-friendly" },
  { id: "city_center", label: "Near city center" },
  { id: "family_friendly", label: "Family-friendly" },
] as const;

export function minutesToDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function timeWindowForHour(hour: number): Exclude<TimeWindow, "no_preference"> {
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "red_eye";
}

/**
 * Live inventory smoke test: Viator tours + ranking for 20 random-ish cities.
 * Run: railway run -- npx tsx scripts/qa-live.ts
 */

import { searchViatorActivities } from "../lib/viator";
import { activityMatchesQuery, paginateActivities, rankActivities } from "../lib/activity-rank";
import type { Trip } from "../types";

const CITIES: Array<[string, string]> = [
  ["HNL", "Honolulu (HNL)"],
  ["OGG", "Kahului (OGG)"],
  ["KOA", "Kailua-Kona (KOA)"],
  ["LIH", "Lihue (LIH)"],
  ["CUN", "Cancun (CUN)"],
  ["SJU", "San Juan (SJU)"],
  ["MIA", "Miami (MIA)"],
  ["FLL", "Fort Lauderdale (FLL)"],
  ["LAS", "Las Vegas (LAS)"],
  ["LAX", "Los Angeles (LAX)"],
  ["SAN", "San Diego (SAN)"],
  ["SFO", "San Francisco (SFO)"],
  ["SEA", "Seattle (SEA)"],
  ["ATL", "Atlanta (ATL)"],
  ["BOS", "Boston (BOS)"],
  ["ORD", "Chicago (ORD)"],
  ["MSY", "New Orleans (MSY)"],
  ["AUS", "Austin (AUS)"],
  ["DEN", "Denver (DEN)"],
  ["PHX", "Phoenix (PHX)"],
  ["RDU", "Raleigh (RDU)"],
  ["MCO", "Orlando (MCO)"],
  ["TPA", "Tampa (TPA)"],
  ["PDX", "Portland (PDX)"],
  ["ANC", "Anchorage (ANC)"],
];

function tripFor(code: string, label: string): Trip {
  return {
    id: "qa",
    status: "activities",
    tripType: "round_trip",
    departureCode: "JFK",
    departureLabel: "New York (JFK)",
    destinationCode: code,
    destinationLabel: label,
    additionalCities: null,
    departureDate: "2026-10-12",
    returnDate: "2026-10-19",
    flexibleDates: false,
    flexibleDays: null,
    tripPurpose: "vacation",
    contactEmail: "qa@example.com",
    adultCount: 2,
    childCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  const summary: Array<Record<string, unknown>> = [];
  for (const [code, label] of CITIES) {
    const trip = tripFor(code, label);
    try {
      const { activities, live, total } = await searchViatorActivities(trip);
      const scuba = rankActivities(activities.filter((a) => activityMatchesQuery(a, "scuba diving")));
      const pages = paginateActivities(scuba.length ? scuba : activities, 1);
      const top = (scuba[0] ?? activities[0]) as { name?: string; pricePerPerson?: number; rating?: number } | undefined;
      summary.push({
        city: label,
        live,
        total,
        scuba: scuba.length,
        scubaPages: scuba.length ? pages.totalPages : 0,
        highest: pages.highestPrice,
        lowest: pages.lowestPrice,
        top: top ? `${top.name} $${top.pricePerPerson} ${top.rating ?? ""}★` : "none",
        ok: live && total > 0,
      });
    } catch (error) {
      summary.push({
        city: label,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const ok = summary.filter((row) => row.ok).length;
  console.log(JSON.stringify({ ok, of: summary.length, rows: summary }, null, 2));
  if (ok < 15) process.exit(1);
}

main();

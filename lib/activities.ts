/** Activities discovery: Viator inventory + Places snapshots. */

import { searchViatorActivities } from "@/lib/viator";
import { rankActivities } from "@/lib/activity-rank";
import type { ActivityOption, Trip } from "@/types";

const resultsCache = new Map<
  string,
  { expires: number; activities: ActivityOption[]; inventorySource: "mock" | "viator"; live: boolean; total: number }
>();

function cacheKey(trip: Trip, query?: string) {
  return `${trip.id}|${(query ?? "").trim().toLowerCase()}`;
}

export async function searchActivities(
  trip: Trip,
  query?: string
): Promise<{
  activities: ActivityOption[];
  inventorySource: "mock" | "viator";
  live: boolean;
  total: number;
}> {
  const key = cacheKey(trip, query);
  const hit = resultsCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return { activities: hit.activities, inventorySource: hit.inventorySource, live: hit.live, total: hit.total };
  }
  const { activities, live } = await searchViatorActivities(trip, { query, start: 1, count: 50 });
  const ranked = rankActivities(activities, query);
  const packed = {
    expires: Date.now() + 8 * 60 * 1000,
    activities: ranked,
    inventorySource: (live ? "viator" : "mock") as "mock" | "viator",
    live,
    total: ranked.length,
  };
  resultsCache.set(key, packed);
  return { activities: packed.activities, inventorySource: packed.inventorySource, live: packed.live, total: packed.total };
}

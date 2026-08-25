/** Activities discovery: Viator inventory + Places snapshots. */

import { searchViatorActivities } from "@/lib/viator";
import { rankActivities } from "@/lib/activity-rank";
import type { ActivityOption, Trip } from "@/types";

export async function searchActivities(
  trip: Trip,
  query?: string
): Promise<{
  activities: ActivityOption[];
  inventorySource: "mock" | "viator";
  live: boolean;
  total: number;
}> {
  const { activities, total, live } = await searchViatorActivities(trip, { query, start: 1, count: 50 });
  return {
    activities: rankActivities(activities, query),
    inventorySource: live ? "viator" : "mock",
    live,
    total,
  };
}

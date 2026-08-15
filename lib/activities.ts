/** Activities discovery: Viator inventory + Places snapshots. */

import { searchViatorActivities, isLiveViator } from "@/lib/viator";
import { lookupPlace } from "@/lib/places";
import type { ActivityOption, Trip } from "@/types";

export async function searchActivities(trip: Trip): Promise<{
  activities: ActivityOption[];
  inventorySource: "mock" | "viator";
}> {
  const activities = await searchViatorActivities(trip);
  const enriched = await Promise.all(
    activities.map(async (activity) => ({
      ...activity,
      place: await lookupPlace(`${activity.name} ${trip.destinationLabel.split("(")[0].trim()}`),
    }))
  );
  return {
    activities: enriched,
    inventorySource: isLiveViator() ? "viator" : "mock",
  };
}

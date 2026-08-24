/** Rank live activities by bang-for-buck, not cheapest. */

import type { ActivityOption } from "@/types";

export const ACTIVITY_PAGE_SIZE = 8;

function durationHours(activity: ActivityOption) {
  if (activity.durationMinutes && activity.durationMinutes > 0) {
    return Math.max(activity.durationMinutes / 60, 0.5);
  }
  const hours = activity.duration.match(/(\d+(?:\.\d+)?)\s*hour/i);
  if (hours) return Math.max(Number(hours[1]), 0.5);
  const minutes = activity.duration.match(/(\d+)\s*min/i);
  if (minutes) return Math.max(Number(minutes[1]) / 60, 0.5);
  return 2;
}

export function activityValueScore(activity: ActivityOption) {
  const price = Math.max(activity.pricePerPerson, 1);
  const rating = activity.rating ?? 4.1;
  const reviews = Math.log10((activity.reviewCount ?? 12) + 10);
  const hours = durationHours(activity);
  const extras = 1 + 0.12 * (activity.inclusions?.length ?? 0) + (activity.freeCancellation ? 0.08 : 0);
  return (rating * reviews * Math.sqrt(hours) * extras) / Math.sqrt(price);
}

export function rankActivities(activities: ActivityOption[]): ActivityOption[] {
  return [...activities]
    .map((activity) => ({ ...activity, valueScore: activityValueScore(activity) }))
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));
}

export function paginateActivities(activities: ActivityOption[], page: number, pageSize = ACTIVITY_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total: activities.length,
    totalPages: Math.max(1, Math.ceil(activities.length / pageSize)),
    items: activities.slice(start, start + pageSize),
    highestPrice: activities.reduce((max, a) => Math.max(max, a.pricePerPerson), 0),
    lowestPrice: activities.reduce((min, a) => Math.min(min, a.pricePerPerson), activities[0]?.pricePerPerson ?? 0),
  };
}

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
  const extras = 1 + 0.1 * (activity.inclusions?.length ?? 0) + (activity.freeCancellation ? 0.08 : 0);
  const quality = Math.pow(rating, 1.55) * reviews;
  const experience = Math.pow(hours, 0.65) * extras;
  return (quality * experience) / Math.pow(price, 0.45);
}

export function activityValueReason(activity: ActivityOption) {
  const bits: string[] = [];
  if (activity.rating) bits.push(`${activity.rating.toFixed(1)}★`);
  if (activity.reviewCount) bits.push(`${activity.reviewCount.toLocaleString()} reviews`);
  if (activity.duration && activity.duration !== "Flexible") bits.push(activity.duration);
  bits.push(`$${Math.round(activity.pricePerPerson)}`);
  return bits.join(" · ");
}

export function rankActivities(activities: ActivityOption[]): ActivityOption[] {
  return [...activities]
    .map((activity) => ({
      ...activity,
      valueScore: activityValueScore(activity),
      valueReason: activityValueReason(activity),
    }))
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));
}

export function paginateActivities(activities: ActivityOption[], page: number, pageSize = ACTIVITY_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const prices = activities.map((a) => a.pricePerPerson).filter((n) => n > 0);
  return {
    page: safePage,
    pageSize,
    total: activities.length,
    totalPages: Math.max(1, Math.ceil(activities.length / pageSize)),
    items: activities.slice(start, start + pageSize),
    highestPrice: prices.length ? Math.max(...prices) : 0,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
  };
}

const QUERY_ALIASES: Record<string, string[]> = {
  scuba: ["scuba", "dive", "diving"],
  diving: ["diving", "dive", "scuba"],
  dive: ["dive", "diving", "scuba"],
  snorkel: ["snorkel", "snorkeling"],
  snorkeling: ["snorkeling", "snorkel"],
  food: ["food", "culinary", "tasting", "foodie", "gastro"],
  tour: ["tour", "walk", "walking", "guided"],
  sunset: ["sunset", "golden hour", "sail", "cruise"],
  cruise: ["cruise", "sail", "boat", "catamaran"],
  museum: ["museum", "gallery", "culture", "skip-the-line"],
};

const STRONG_TOKENS = new Set(["scuba", "diving", "dive", "snorkel", "snorkeling"]);

export function activityMatchesQuery(activity: ActivityOption, query?: string) {
  const raw = query?.trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!raw) return true;
  const nameCat = `${activity.name} ${activity.category}`.toLowerCase();
  const hay = `${nameCat} ${activity.description}`.toLowerCase();
  if (nameCat.includes(raw)) return true;
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2);
  if (!tokens.length) return true;
  if (tokens.includes("scuba")) {
    return nameCat.includes("scuba") || nameCat.includes("padi");
  }
  const strong = tokens.filter((token) => STRONG_TOKENS.has(token));
  if (strong.length) {
    return strong.every((token) => {
      const aliases = QUERY_ALIASES[token] ?? [token];
      return aliases.some((alias) => nameCat.includes(alias));
    });
  }
  return tokens.every((token) => {
    const aliases = QUERY_ALIASES[token] ?? [token];
    return aliases.some((alias) => hay.includes(alias));
  });
}

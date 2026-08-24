/** Rank live activities by best overall deal: high ratings, real extras, cheap as a high priority. */

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

function typicalPrice(activities: ActivityOption[]) {
  const prices = activities.map((a) => a.pricePerPerson).filter((n) => n > 0).sort((a, b) => a - b);
  if (!prices.length) return 100;
  return prices[Math.floor(prices.length / 2)] || 100;
}

export function activityValueScore(activity: ActivityOption, typical = 100) {
  const price = Math.max(activity.pricePerPerson, 1);
  const rating = activity.rating ?? 3.8;
  const reviewCount = activity.reviewCount ?? 8;
  const reviews = Math.log10(reviewCount + 10);
  const reviewTrust = reviewCount < 10 ? 0.3 : reviewCount < 40 ? 0.6 : reviewCount < 150 ? 0.85 : 1;
  const extras =
    1 +
    0.07 * Math.min(activity.inclusions?.length ?? 0, 8) +
    (activity.freeCancellation ? 0.15 : 0);
  const deal =
    activity.listPrice && activity.listPrice > price
      ? 1 + Math.min((activity.listPrice - price) / activity.listPrice, 0.25)
      : 1;
  const hours = Math.min(durationHours(activity), 8);
  const timeWorth = Math.pow(Math.max(hours, 0.75), 0.35);
  const quality = Math.pow(rating, 3.4) * reviews * reviewTrust;
  const relativePrice = price / Math.max(typical, 1);
  return (quality * extras * deal * timeWorth) / Math.pow(relativePrice, 0.75);
}

export function activityValueReason(activity: ActivityOption) {
  const bits: string[] = [];
  if (activity.rating) bits.push(`${activity.rating.toFixed(1)}★`);
  if (activity.reviewCount) bits.push(`${activity.reviewCount.toLocaleString()} reviews`);
  bits.push(`$${Math.round(activity.pricePerPerson)}`);
  if (activity.freeCancellation) bits.push("free cancel");
  return bits.join(" · ");
}

export function rankActivities(activities: ActivityOption[]): ActivityOption[] {
  const typical = typicalPrice(activities);
  return [...activities]
    .map((activity) => ({
      ...activity,
      valueScore: activityValueScore(activity, typical),
      valueReason: activityValueReason(activity),
    }))
    .sort((a, b) => {
      const diff = (b.valueScore ?? 0) - (a.valueScore ?? 0);
      if (Math.abs(diff) > 0.0001) return diff;
      if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
      return a.pricePerPerson - b.pricePerPerson;
    });
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
  scuba: ["scuba", "dive", "diving", "padi"],
  diving: ["diving", "dive", "scuba"],
  dive: ["dive", "diving", "scuba"],
  snorkel: ["snorkel", "snorkeling"],
  snorkeling: ["snorkeling", "snorkel"],
  restaurant: ["restaurant", "dining", "dinner", "lunch", "luau", "food", "culinary", "tasting"],
  restaurants: ["restaurant", "dining", "dinner", "lunch", "luau", "food", "culinary", "tasting"],
  food: ["food", "culinary", "tasting", "foodie", "gastro", "dining", "restaurant", "luau", "eat"],
  dining: ["dining", "dinner", "restaurant", "luau", "food", "culinary"],
  luau: ["luau", "dinner", "feast", "show"],
  tour: ["tour", "walk", "walking", "guided"],
  sunset: ["sunset", "golden hour", "sail", "cruise"],
  cruise: ["cruise", "sail", "boat", "catamaran"],
  museum: ["museum", "gallery", "culture", "skip-the-line"],
  spa: ["spa", "massage", "wellness"],
  hike: ["hike", "hiking", "trail", "waterfall"],
  hiking: ["hike", "hiking", "trail", "waterfall"],
};

const STRONG_TOKENS = new Set(["scuba", "diving", "dive", "snorkel", "snorkeling"]);

function normalizeToken(token: string) {
  if (QUERY_ALIASES[token]) return token;
  if (token.endsWith("s") && QUERY_ALIASES[token.slice(0, -1)]) return token.slice(0, -1);
  return token;
}

export function activityMatchesQuery(activity: ActivityOption, query?: string) {
  const raw = query?.trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!raw) return true;
  const nameCat = `${activity.name} ${activity.category}`.toLowerCase();
  const hay = `${nameCat} ${activity.description}`.toLowerCase();
  if (nameCat.includes(raw) || hay.includes(raw)) return true;
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2).map(normalizeToken);
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

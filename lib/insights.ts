/** Match Layer B research findings onto bookable Layer A items. */

import type { ActivityOption, DestinationResearch, HotelOption, ResearchFinding } from "@/types";

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function allFindings(research: DestinationResearch | null): ResearchFinding[] {
  if (!research) return [];
  return [...research.deals, ...research.events, ...research.localFavorites];
}

export function matchFindings(name: string, findings: ResearchFinding[], kind: ResearchFinding["kind"]) {
  const target = norm(name);
  return findings.filter((finding) => {
    if (finding.kind !== kind && finding.kind !== "general") return false;
    if (!finding.relatedNames.length) return false;
    return finding.relatedNames.some((hint) => {
      const h = norm(hint);
      return h.length >= 4 && (target.includes(h) || h.includes(target.split(" ")[0] ?? ""));
    });
  });
}

export function attachHotelInsights(hotels: HotelOption[], research: DestinationResearch | null): HotelOption[] {
  const findings = allFindings(research);
  return hotels.map((hotel) => ({
    ...hotel,
    liveInsights: matchFindings(hotel.name, findings, "hotel"),
  }));
}

export function attachActivityInsights(
  activities: ActivityOption[],
  research: DestinationResearch | null
): ActivityOption[] {
  const findings = allFindings(research);
  return activities.map((activity) => ({
    ...activity,
    liveInsights: matchFindings(activity.name, findings, "activity"),
  }));
}

export function unmatchedFindings(
  research: DestinationResearch | null,
  used: ResearchFinding[]
): ResearchFinding[] {
  const usedIds = new Set(used.map((f) => f.id));
  return allFindings(research).filter((f) => !usedIds.has(f.id));
}

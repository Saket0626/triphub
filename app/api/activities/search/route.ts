/** Activity search — Viator-shaped inventory (mock until partner key), plus research merge. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedResearch, getTripBundle, saveCachedResearch } from "@/lib/db";
import { searchActivities } from "@/lib/activities";
import { attachActivityInsights, unmatchedFindings } from "@/lib/insights";
import { ACTIVITY_PAGE_SIZE, paginateActivities } from "@/lib/activity-rank";
import { researchCacheKey, runDestinationResearch } from "@/lib/research";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  tripId: z.string().min(1),
  query: z.string().max(80).optional(),
  page: z.number().int().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const { tripId, query, page } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const cacheKey = researchCacheKey(bundle.trip);
    const [{ activities, inventorySource, live, total }, cached] = await Promise.all([
      searchActivities(bundle.trip, query),
      getCachedResearch(cacheKey),
    ]);
    let research = cached;
    if (!research) {
      try {
        research = await runDestinationResearch(bundle.trip);
        await saveCachedResearch(bundle.trip, cacheKey, research);
      } catch {
        research = undefined;
      }
    }
    const usable = research && research.source !== "mock" ? research : null;
    const withInsights = usable ? attachActivityInsights(activities, usable) : activities;
    const used = withInsights.flatMap((a) => a.liveInsights ?? []);
    const paged = paginateActivities(withInsights, page ?? 1, ACTIVITY_PAGE_SIZE);
    return NextResponse.json({
      activities: paged.items,
      allCount: total,
      page: paged.page,
      pageSize: paged.pageSize,
      totalPages: paged.totalPages,
      highestPrice: paged.highestPrice,
      lowestPrice: paged.lowestPrice,
      worthKnowing: usable ? unmatchedFindings(usable, used) : [],
      research: usable,
      inventorySource,
      live,
      researchSource: usable?.source ?? null,
      sandbox: env.sandboxMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

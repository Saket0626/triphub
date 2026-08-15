/** Activity search — Viator-shaped inventory (mock until partner key), plus research merge. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedResearch, getTripBundle, saveCachedResearch } from "@/lib/db";
import { searchActivities } from "@/lib/activities";
import { attachActivityInsights, unmatchedFindings } from "@/lib/insights";
import { researchCacheKey, runDestinationResearch } from "@/lib/research";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({ tripId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const cacheKey = researchCacheKey(bundle.trip);
    const [{ activities, inventorySource }, cached] = await Promise.all([
      searchActivities(bundle.trip),
      getCachedResearch(cacheKey),
    ]);
    const research = cached ?? (await runDestinationResearch(bundle.trip));
    if (!cached) await saveCachedResearch(bundle.trip, cacheKey, research);

    const withInsights = attachActivityInsights(activities, research);
    const used = withInsights.flatMap((a) => a.liveInsights ?? []);
    return NextResponse.json({
      activities: withInsights,
      worthKnowing: unmatchedFindings(research, used),
      research,
      inventorySource,
      researchSource: research.source,
      sandbox: env.sandboxMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

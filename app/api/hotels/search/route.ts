/** Hotel search API — LiteAPI/mock inventory, Places snapshots, research merge. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedResearch, getTripBundle, saveCachedResearch } from "@/lib/db";
import { searchHotelsWithPlaces } from "@/lib/hotels";
import { attachHotelInsights, unmatchedFindings } from "@/lib/insights";
import { researchCacheKey, runDestinationResearch } from "@/lib/research";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ tripId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle?.hotelPreferences) {
      return NextResponse.json({ error: "Confirm hotel preferences first" }, { status: 400 });
    }

    const cacheKey = researchCacheKey(bundle.trip);
    const [hotels, cached] = await Promise.all([
      searchHotelsWithPlaces(bundle.trip, bundle.hotelPreferences),
      getCachedResearch(cacheKey),
    ]);
    const research = cached ?? (await runDestinationResearch(bundle.trip));
    if (!cached) await saveCachedResearch(bundle.trip, cacheKey, research);

    const withInsights = attachHotelInsights(hotels, research);
    const used = withInsights.flatMap((h) => h.liveInsights ?? []);
    return NextResponse.json({
      hotels: withInsights,
      worthKnowing: unmatchedFindings(research, used),
      research,
      inventorySource: env.sandboxMode ? "mock" : "liteapi",
      researchSource: research.source,
      sandbox: env.sandboxMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

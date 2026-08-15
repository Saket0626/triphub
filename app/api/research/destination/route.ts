/** Destination research: cached 24h, mock while SANDBOX_MODE or no Anthropic key. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCachedResearch, getTripBundle, saveCachedResearch } from "@/lib/db";
import { researchCacheKey, runDestinationResearch } from "@/lib/research";

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
    const cached = await getCachedResearch(cacheKey);
    if (cached) {
      return NextResponse.json({ research: cached, cache: "hit" });
    }
    const research = await runDestinationResearch(bundle.trip);
    await saveCachedResearch(bundle.trip, cacheKey, research);
    return NextResponse.json({ research, cache: "miss" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

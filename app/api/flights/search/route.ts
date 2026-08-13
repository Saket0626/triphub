/** Flight search API — sandbox mocks, or Duffel when SANDBOX_MODE=false. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripBundle } from "@/lib/db";
import { searchFlights } from "@/lib/flights";

export const runtime = "nodejs";

const bodySchema = z.object({ tripId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle?.preferences) {
      return NextResponse.json({ error: "Trip or flight preferences not found" }, { status: 404 });
    }
    const flights = await searchFlights(bundle.trip, bundle.preferences);
    return NextResponse.json({ flights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

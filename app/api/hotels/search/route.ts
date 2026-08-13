/** Hotel search API — sandbox mocks, or LiteAPI when SANDBOX_MODE=false. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripBundle } from "@/lib/db";
import { searchHotels } from "@/lib/hotels";

export const runtime = "nodejs";

const bodySchema = z.object({ tripId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle?.hotelPreferences) {
      return NextResponse.json({ error: "Confirm hotel preferences first" }, { status: 400 });
    }
    const hotels = await searchHotels(bundle.trip, bundle.hotelPreferences);
    return NextResponse.json({ hotels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** POST /api/trips — persist intake after the first confirmation gate. */

import { NextResponse } from "next/server";
import { createTripFromIntake } from "@/lib/db";
import {
  flightPreferencesSchema,
  travelersStepSchema,
  tripBasicsSchema,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const basics = tripBasicsSchema.parse(body);
    const travelers = travelersStepSchema.parse(body);
    const prefs = flightPreferencesSchema.parse(body);
    const bundle = await createTripFromIntake({ ...basics, ...travelers, ...prefs });
    return NextResponse.json({ id: bundle.trip.id, trip: bundle.trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid trip data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

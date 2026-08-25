/** Flight search API — sandbox mocks, or Duffel when SANDBOX_MODE=false. */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripBundle, updateTripDates } from "@/lib/db";
import { searchFlights } from "@/lib/flights";

export const runtime = "nodejs";
export const maxDuration = 120;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const bodySchema = z.object({
  tripId: z.string().min(1),
  departureDate: isoDate.optional(),
  returnDate: isoDate.nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { tripId, departureDate, returnDate } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle?.preferences) {
      return NextResponse.json({ error: "Trip or flight preferences not found" }, { status: 404 });
    }
    const trip =
      departureDate
        ? { ...bundle.trip, departureDate, returnDate: returnDate === undefined ? bundle.trip.returnDate : returnDate }
        : bundle.trip;
    const result = await searchFlights(trip, bundle.preferences, { exactDates: Boolean(departureDate) });
    if (departureDate && (result.departureDate !== bundle.trip.departureDate || result.returnDate !== bundle.trip.returnDate)) {
      await updateTripDates(tripId, result.departureDate, result.returnDate);
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

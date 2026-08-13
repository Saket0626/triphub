import { NextResponse } from "next/server";
import { hotelPreferencesSchema } from "@/lib/validation";
import { saveHotelPreferences } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = hotelPreferencesSchema.parse(await request.json());
    const preferences = await saveHotelPreferences(params.id, input);
    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save preferences";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

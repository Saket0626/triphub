import { NextResponse } from "next/server";
import { saveFlightSelection } from "@/lib/db";
import type { FlightOption } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { offer: FlightOption };
    if (!body.offer?.id) return NextResponse.json({ error: "Missing flight offer" }, { status: 400 });
    const selection = await saveFlightSelection(params.id, body.offer);
    return NextResponse.json({ selection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save flight";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

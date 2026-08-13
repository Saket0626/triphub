import { NextResponse } from "next/server";
import { saveHotelSelection } from "@/lib/db";
import type { HotelOption } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { offer: HotelOption };
    if (!body.offer?.id) return NextResponse.json({ error: "Missing hotel offer" }, { status: 400 });
    const selection = await saveHotelSelection(params.id, body.offer);
    return NextResponse.json({ selection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save hotel";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

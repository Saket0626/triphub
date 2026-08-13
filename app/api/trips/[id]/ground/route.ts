import { NextResponse } from "next/server";
import { saveGroundSelection } from "@/lib/db";
import type { GroundChoice, GroundOption } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { choice: GroundChoice; option: GroundOption | null };
    if (!body.choice) return NextResponse.json({ error: "Missing choice" }, { status: 400 });
    const selection = await saveGroundSelection(params.id, body.choice, body.option ?? null);
    return NextResponse.json({ selection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save ground transport";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

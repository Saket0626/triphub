import { NextResponse } from "next/server";
import { saveActivitySelection } from "@/lib/db";
import type { ActivityOption } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { skipped: boolean; options: ActivityOption[] };
    const selection = await saveActivitySelection(params.id, Boolean(body.skipped), body.options ?? []);
    return NextResponse.json({ selection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save activities";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

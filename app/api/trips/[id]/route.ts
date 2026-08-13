import { NextResponse } from "next/server";
import { getTripBundle } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  return NextResponse.json(bundle);
}

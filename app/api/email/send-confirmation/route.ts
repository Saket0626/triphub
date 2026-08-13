/** Send the booking confirmation email via Resend (or skip if the key is a placeholder). */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripBundle } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

const bodySchema = z.object({ tripId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { tripId } = bodySchema.parse(await request.json());
    const bundle = await getTripBundle(tripId);
    if (!bundle?.booking) {
      return NextResponse.json({ error: "No booking found for this trip" }, { status: 404 });
    }
    const result = await sendConfirmationEmail(bundle.booking, bundle.trip.contactEmail);
    return NextResponse.json({ result, to: bundle.trip.contactEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

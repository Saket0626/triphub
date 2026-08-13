import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { GroundConfirmClient } from "@/components/trip/confirms";

export const runtime = "nodejs";

export default async function GroundConfirmPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <GroundConfirmClient tripId={params.id} />;
}

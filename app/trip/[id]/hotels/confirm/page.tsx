import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { HotelConfirmClient } from "@/components/trip/confirms";

export const runtime = "nodejs";

export default async function HotelConfirmPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <HotelConfirmClient tripId={params.id} />;
}

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { FlightConfirmClient } from "@/components/trip/confirms";

export const runtime = "nodejs";

export default async function FlightConfirmPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return (
    <FlightConfirmClient
      tripId={params.id}
      travelers={bundle.trip.adultCount + bundle.trip.childCount}
    />
  );
}

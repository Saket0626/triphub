import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { ActivitiesConfirmClient } from "@/components/trip/confirms";

export const runtime = "nodejs";

export default async function ActivitiesConfirmPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <ActivitiesConfirmClient tripId={params.id} />;
}

/** Optional destination activities, tailored to trip purpose. */

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { ActivitiesFlow } from "@/components/trip/optional-steps";

export const runtime = "nodejs";

export default async function ActivitiesPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <ActivitiesFlow bundle={bundle} />;
}

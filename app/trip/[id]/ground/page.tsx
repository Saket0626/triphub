/** Optional airport transfer / rental car step. Skipping is a valid, explicit choice. */

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { GroundFlow } from "@/components/trip/optional-steps";

export const runtime = "nodejs";

export default async function GroundPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <GroundFlow bundle={bundle} />;
}

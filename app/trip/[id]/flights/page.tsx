/** Flight search & selection — ranked recommendations, never auto-selected. */

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { FlightSearch } from "@/components/trip/flight-search";

export const runtime = "nodejs";

export default async function FlightsPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <FlightSearch bundle={bundle} />;
}

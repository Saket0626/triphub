/** Hotel recommendations & selection — suggestion only, user must click then confirm. */

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { HotelFlow } from "@/components/trip/hotel-flow";

export const runtime = "nodejs";

export default async function HotelsPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <HotelFlow bundle={bundle} />;
}

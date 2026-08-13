/** Final review + confirmation gate. The Book This Trip button stays disabled until the review checkbox is checked. */

import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { ReviewBooking } from "@/components/trip/review-booking";

export const runtime = "nodejs";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { canceled?: string };
}) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();
  return <ReviewBooking bundle={bundle} canceled={searchParams.canceled === "1"} />;
}

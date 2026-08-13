import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { PageShell } from "@/components/site-header";
import { JourneyProgress } from "@/components/wizard/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TripLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id: string };
}) {
  const bundle = await getTripBundle(params.id);
  if (!bundle) notFound();

  return (
    <PageShell width="default">
      <p className="mb-2 text-sm text-muted-foreground">
        {bundle.trip.departureCode} → {bundle.trip.destinationCode}
        <span className="mx-2">·</span>
        {bundle.trip.adultCount + bundle.trip.childCount} traveler
        {bundle.trip.adultCount + bundle.trip.childCount === 1 ? "" : "s"}
      </p>
      <JourneyProgress tripId={bundle.trip.id} status={bundle.trip.status} />
      {children}
    </PageShell>
  );
}

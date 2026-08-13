/** Post-booking summary. Confirmation number, itinerary, and email status. */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTripBundle } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export default async function ConfirmationPage({ params }: { params: { id: string } }) {
  const bundle = await getTripBundle(params.id);
  if (!bundle?.booking) notFound();
  const booking = bundle.booking;
  const snap = booking.itinerarySnapshot;

  return (
    <div className="animate-fade-up py-6 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-primary">Booked</p>
      <h1 className="mt-3 font-serif text-4xl">You’re all set</h1>
      <p className="mt-3 text-muted-foreground">
        Confirmation <span className="font-medium text-foreground">{booking.confirmationNumber}</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {env.sandboxMode
          ? "Sandbox booking — a confirmation email was prepared (sent live only if Resend is configured)."
          : `A confirmation email is on its way to ${bundle.trip.contactEmail}.`}
      </p>
      <Card className="mx-auto mt-10 max-w-xl text-left">
        <CardContent className="space-y-4 pt-6 text-sm">
          <p>
            <span className="text-muted-foreground">Travelers</span>
            <br />
            {snap.travelers.map((t) => t.fullName).join(", ")}
          </p>
          {snap.flight ? (
            <p>
              <span className="text-muted-foreground">Flight</span>
              <br />
              {snap.flight.airline} {snap.flight.flightNumber} · {snap.flight.from} → {snap.flight.to}
              <br />
              {formatDate(snap.trip.departureDate)}
              {snap.trip.returnDate ? ` – ${formatDate(snap.trip.returnDate)}` : ""}
            </p>
          ) : null}
          {snap.hotel ? (
            <p>
              <span className="text-muted-foreground">Hotel</span>
              <br />
              {snap.hotel.name} · {snap.hotel.neighborhood}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">Ground</span>
            <br />
            {snap.ground ? snap.ground.title : "No ground transport added"}
          </p>
          <p>
            <span className="text-muted-foreground">Activities</span>
            <br />
            {snap.activities.length ? snap.activities.map((a) => a.name).join(", ") : "None added"}
          </p>
          <p className="font-serif text-2xl">{formatCurrency(snap.totalPrice)}</p>
        </CardContent>
      </Card>
      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/">Plan another trip</Link>
        </Button>
      </div>
    </div>
  );
}

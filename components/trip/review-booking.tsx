"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TripBundle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/form-controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog";
import { SectionHeader } from "@/components/wizard/progress";

function itineraryTotal(bundle: TripBundle) {
  const flight = bundle.flightSelection?.offer.totalPrice ?? 0;
  const hotel = bundle.hotelSelection?.offer.totalPrice ?? 0;
  const ground =
    bundle.groundSelection?.choice === "yes" ? bundle.groundSelection.option?.priceEstimate ?? 0 : 0;
  const activities = bundle.activitySelection?.skipped
    ? 0
    : (bundle.activitySelection?.options ?? []).reduce((sum, a) => sum + a.totalPrice, 0);
  return flight + hotel + ground + activities;
}

export function ReviewBooking({
  bundle,
  canceled = false,
}: {
  bundle: TripBundle;
  canceled?: boolean;
}) {
  const router = useRouter();
  const [reviewed, setReviewed] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = itineraryTotal(bundle);
  const flight = bundle.flightSelection?.offer;
  const hotel = bundle.hotelSelection?.offer;
  const route = flight ? `${flight.from}–${flight.to}` : "your route";
  const hotelName = hotel?.name ?? "your hotel";

  async function book() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: bundle.trip.id, reviewed: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Booking failed");
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      router.push(`/trip/${bundle.trip.id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Final review"
        title="Last look"
        description="This is everything. Check the box, then book."
      />
      <div className="grid gap-4">
        <Line
          label="Flight"
          href={`/trip/${bundle.trip.id}/flights`}
          value={
            flight
              ? `${flight.airline} ${flight.flightNumber} · ${flight.from} → ${flight.to} · ${formatDate(bundle.trip.departureDate)}`
              : "Not selected"
          }
          price={flight?.totalPrice}
        />
        <Line
          label="Hotel"
          href={`/trip/${bundle.trip.id}/hotels`}
          value={hotel ? `${hotel.name} · ${hotel.neighborhood}` : "Not selected"}
          price={hotel?.totalPrice}
        />
        <Line
          label="Ground"
          href={`/trip/${bundle.trip.id}/ground`}
          value={
            bundle.groundSelection?.choice === "yes" && bundle.groundSelection.option
              ? bundle.groundSelection.option.title
              : "No ground transport added"
          }
          price={bundle.groundSelection?.choice === "yes" ? bundle.groundSelection.option?.priceEstimate : 0}
        />
        <Line
          label="Activities"
          href={`/trip/${bundle.trip.id}/activities`}
          value={
            bundle.activitySelection?.skipped || !bundle.activitySelection?.options.length
              ? "None added"
              : bundle.activitySelection.options.map((a) => a.name).join(", ")
          }
          price={
            bundle.activitySelection?.skipped
              ? 0
              : bundle.activitySelection?.options.reduce((s, a) => s + a.totalPrice, 0)
          }
        />
      </div>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Running total</p>
            <p className="font-serif text-3xl">{formatCurrency(total)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg">Travelers</h2>
            <Link href="/trip/new" className="text-sm text-primary">
              Change
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {bundle.travelers.map((t) => (
              <li key={t.id}>
                {t.fullName} · {t.type}
                {t.age !== null ? ` (${t.age})` : ""} · born {formatDate(t.dateOfBirth)}
              </li>
            ))}
            <li className="text-muted-foreground">Confirmation email: {bundle.trip.contactEmail}</li>
          </ul>
        </CardContent>
      </Card>
      <label className="mt-8 flex items-start gap-3 rounded-2xl border bg-card p-4">
        <Checkbox checked={reviewed} onCheckedChange={(c) => setReviewed(Boolean(c))} className="mt-1" />
        <span className="text-sm">Yep, I looked this over and it looks right</span>
      </label>
      {canceled ? (
        <p className="mt-3 text-sm text-destructive">Payment was canceled. Nothing was booked.</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.push(`/trip/${bundle.trip.id}/activities`)}>
          Go back
        </Button>
        <Button variant="book" size="xl" disabled={!reviewed || loading} onClick={() => setOpen(true)}>
          Book this trip
        </Button>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>One last yes</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to book {route} and {hotelName} for {formatCurrency(total)}. You&apos;ll pay
              on Stripe with a test card (4242 4242 4242 4242). Sound good?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={book} disabled={loading}>
              {loading ? "Booking…" : "Yes, book it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Line({
  label,
  value,
  price,
  href,
}: {
  label: string;
  value: string;
  price?: number;
  href: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm">{value}</p>
          <Link href={href} className="mt-2 inline-block text-sm text-primary">
            Change
          </Link>
        </div>
        <p className="font-serif text-xl">{formatCurrency(price ?? 0)}</p>
      </CardContent>
    </Card>
  );
}

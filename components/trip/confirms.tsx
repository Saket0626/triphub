"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityOption, FlightOption, GroundChoice, GroundOption, HotelOption } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { clearPending, getPending, pendingKey } from "@/lib/pending";
import { FlightSummary } from "@/components/trip/flight-search";
import { PendingConfirm } from "@/components/trip/optional-steps";
import { HOTEL_MUST_HAVES } from "@/lib/labels";

export function FlightConfirmClient({ tripId, travelers }: { tripId: string; travelers: number }) {
  const router = useRouter();
  const [offer, setOffer] = useState<FlightOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOffer(getPending<FlightOption>(pendingKey.flight(tripId)));
  }, [tripId]);

  if (!offer) {
    return (
      <p className="text-muted-foreground">
        No flight is waiting to be confirmed.{" "}
        <button className="text-primary" onClick={() => router.push(`/trip/${tripId}/flights`)}>
          Choose a flight
        </button>
      </p>
    );
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/flight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not confirm");
      clearPending(pendingKey.flight(tripId));
      router.push(`/trip/${tripId}/hotels`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
      setLoading(false);
    }
  }

  return (
    <PendingConfirm
      title="Confirm your flight choice"
      confirmLabel="Confirm and continue to hotels"
      backLabel="Go back and choose a different flight"
      onConfirm={confirm}
      onBack={() => router.push(`/trip/${tripId}/flights`)}
      loading={loading}
    >
      <FlightSummary flight={offer} travelers={travelers} />
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </PendingConfirm>
  );
}

export function HotelConfirmClient({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [offer, setOffer] = useState<HotelOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOffer(getPending<HotelOption>(pendingKey.hotel(tripId)));
  }, [tripId]);

  if (!offer) {
    return (
      <p className="text-muted-foreground">
        No hotel is waiting to be confirmed.{" "}
        <button className="text-primary" onClick={() => router.push(`/trip/${tripId}/hotels`)}>
          Choose a hotel
        </button>
      </p>
    );
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/hotel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not confirm");
      clearPending(pendingKey.hotel(tripId));
      router.push(`/trip/${tripId}/ground`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
      setLoading(false);
    }
  }

  return (
    <PendingConfirm
      title="Confirm your hotel"
      confirmLabel="Confirm and continue"
      backLabel="Go back and pick a different hotel"
      onConfirm={confirm}
      onBack={() => router.push(`/trip/${tripId}/hotels`)}
      loading={loading}
    >
      <h2 className="font-serif text-2xl">{offer.name}</h2>
      <p className="text-sm text-muted-foreground">
        {offer.neighborhood}, {offer.city} · {"★".repeat(offer.stars)}
      </p>
      <p className="mt-3">{offer.whyItFits}</p>
      <p className="mt-2 text-sm">
        {offer.amenities.map((a) => HOTEL_MUST_HAVES.find((h) => h.id === a)?.label ?? a).join(" · ")}
      </p>
      <p className="mt-2 text-sm">{offer.cancellationPolicy}</p>
      <p className="mt-4 font-serif text-2xl">{formatCurrency(offer.totalPrice)}</p>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </PendingConfirm>
  );
}

export function GroundConfirmClient({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [pending, setPendingState] = useState<{ choice: GroundChoice; option: GroundOption | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingState(getPending(pendingKey.ground(tripId)));
  }, [tripId]);

  if (!pending) {
    return (
      <p className="text-muted-foreground">
        Nothing to confirm.{" "}
        <button className="text-primary" onClick={() => router.push(`/trip/${tripId}/ground`)}>
          Return to ground transport
        </button>
      </p>
    );
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/ground`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not confirm");
      clearPending(pendingKey.ground(tripId));
      router.push(`/trip/${tripId}/activities`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
      setLoading(false);
    }
  }

  return (
    <PendingConfirm
      title={pending.choice === "yes" ? "Confirm ground transport" : "Confirm skipping ground transport"}
      confirmLabel="Confirm and continue"
      backLabel="Go back"
      onConfirm={confirm}
      onBack={() => router.push(`/trip/${tripId}/ground`)}
      loading={loading}
    >
      {pending.choice === "yes" && pending.option ? (
        <>
          <p className="font-serif text-2xl">{pending.option.title}</p>
          <p className="text-sm text-muted-foreground">{pending.option.description}</p>
          <p className="mt-2 text-sm">{pending.option.details}</p>
          <p className="mt-4 font-serif text-2xl">{formatCurrency(pending.option.priceEstimate)}</p>
        </>
      ) : (
        <p>No ground transport will be added to this trip.</p>
      )}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </PendingConfirm>
  );
}

export function ActivitiesConfirmClient({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [pending, setPendingState] = useState<{ skipped: boolean; options: ActivityOption[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingState(getPending(pendingKey.activities(tripId)));
  }, [tripId]);

  if (!pending) {
    return (
      <p className="text-muted-foreground">
        Nothing to confirm.{" "}
        <button className="text-primary" onClick={() => router.push(`/trip/${tripId}/activities`)}>
          Return to activities
        </button>
      </p>
    );
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not confirm");
      clearPending(pendingKey.activities(tripId));
      router.push(`/trip/${tripId}/review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
      setLoading(false);
    }
  }

  return (
    <PendingConfirm
      title={pending.skipped ? "Confirm skipping activities" : "Confirm your activities"}
      confirmLabel="Confirm and continue to review"
      backLabel="Go back"
      onConfirm={confirm}
      onBack={() => router.push(`/trip/${tripId}/activities`)}
      loading={loading}
    >
      {pending.skipped || pending.options.length === 0 ? (
        <p>No activities will be added.</p>
      ) : (
        <ul className="space-y-3">
          {pending.options.map((a) => (
            <li key={a.id} className="flex justify-between gap-4">
              <span>
                {a.name}
                <span className="block text-xs text-muted-foreground">{a.duration}</span>
              </span>
              <span>{formatCurrency(a.totalPrice)}</span>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </PendingConfirm>
  );
}

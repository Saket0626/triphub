"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hotelPreferencesSchema, type HotelPreferencesInput } from "@/lib/validation";
import { HOTEL_MUST_HAVES } from "@/lib/labels";
import { formatCurrency, nightsBetween } from "@/lib/utils";
import { pendingKey, setPending } from "@/lib/pending";
import type { HotelOption, TripBundle } from "@/types";
import { Badge, Field } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/form-controls";
import { Sheet, SheetContent } from "@/components/ui/dialog";
import { DualSlider, Stepper } from "@/components/wizard/fields";
import { SectionHeader } from "@/components/wizard/progress";

export function HotelFlow({ bundle }: { bundle: TripBundle }) {
  const [prefs, setPrefs] = useState(bundle.hotelPreferences);
  if (!prefs) {
    return <HotelPrefForm bundle={bundle} onSaved={setPrefs} />;
  }
  return <HotelResults bundle={{ ...bundle, hotelPreferences: prefs }} />;
}

function HotelPrefForm({
  bundle,
  onSaved,
}: {
  bundle: TripBundle;
  onSaved: (prefs: NonNullable<TripBundle["hotelPreferences"]>) => void;
}) {
  const form = useForm<HotelPreferencesInput>({
    resolver: zodResolver(hotelPreferencesSchema),
    defaultValues: {
      rooms: 1,
      starRating: "no_preference",
      budgetMin: 120,
      budgetMax: 450,
      mustHaves: [],
    },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(data: HotelPreferencesInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${bundle.trip.id}/hotel-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save preferences");
      onSaved(json.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(save)} className="animate-fade-up">
      <SectionHeader
        eyebrow="Hotels"
        title="What should the stay feel like?"
        description="Confirm these preferences first. We will not show hotels until you do — and nothing is pre-selected."
      />
      <div className="grid gap-6">
        <Field label="Number of rooms">
          <Stepper label="Rooms" min={1} max={8} value={form.watch("rooms")} onChange={(n) => form.setValue("rooms", n)} />
        </Field>
        <Field label="Star rating">
          <select
            className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
            value={form.watch("starRating")}
            onChange={(e) => form.setValue("starRating", e.target.value as HotelPreferencesInput["starRating"])}
          >
            <option value="no_preference">No preference</option>
            <option value="3">3 star</option>
            <option value="4">4 star</option>
            <option value="5">5 star</option>
          </select>
        </Field>
        <Field label="Budget per night">
          <DualSlider
            min={50}
            max={1200}
            value={[form.watch("budgetMin"), form.watch("budgetMax")]}
            onChange={([min, max]) => {
              form.setValue("budgetMin", min);
              form.setValue("budgetMax", max);
            }}
          />
        </Field>
        <Field label="Must-haves">
          <div className="grid gap-2 sm:grid-cols-2">
            {HOTEL_MUST_HAVES.map((item) => {
              const selected = form.watch("mustHaves").includes(item.id);
              return (
                <label key={item.id} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(c) => {
                      const cur = form.getValues("mustHaves");
                      form.setValue("mustHaves", c ? [...cur, item.id] : cur.filter((x) => x !== item.id));
                    }}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </Field>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <div className="mt-8">
        <Button type="submit" variant="confirm" size="lg" disabled={saving}>
          {saving ? "Saving…" : "Confirm preferences and show recommendations"}
        </Button>
      </div>
    </form>
  );
}

function HotelResults({ bundle }: { bundle: TripBundle }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HotelOption | null>(null);
  const nights = nightsBetween(bundle.trip.departureDate, bundle.trip.returnDate);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/hotels/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: bundle.trip.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Search failed");
        if (!cancelled) setHotels(json.hotels);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [bundle.trip.id]);

  function choose(hotel: HotelOption) {
    setPending(pendingKey.hotel(bundle.trip.id), hotel);
    router.push(`/trip/${bundle.trip.id}/hotels/confirm`);
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Researching</p>
        <h1 className="mt-3 font-serif text-3xl">Finding stays that fit your list…</h1>
      </div>
    );
  }
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Hotels"
        title="Recommendations — not a default"
        description="The top card is a suggestion. You must click a hotel to select it; nothing is pre-chosen."
      />
      <div className="grid gap-5">
        {hotels.map((hotel, i) => (
          <Card key={hotel.id}>
            <button type="button" className="grid w-full gap-0 text-left sm:grid-cols-[220px_1fr]" onClick={() => setSelected(hotel)}>
              <div
                className="h-40 bg-cover bg-center sm:h-full sm:rounded-l-2xl"
                style={{ backgroundImage: `url(${hotel.photoUrl})` }}
                role="img"
                aria-label={hotel.photoAlt}
              />
              <CardContent className="space-y-2 pt-6">
                {i === 0 ? (
                  <div>
                    <Badge variant="recommend">Our top recommendation</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">A suggestion only — tap the card to choose it.</p>
                  </div>
                ) : null}
                <h2 className="font-serif text-xl">{hotel.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {"★".repeat(hotel.stars)} · {hotel.neighborhood}
                </p>
                <p className="text-sm">{hotel.whyItFits}</p>
                <p className="text-xs text-muted-foreground">
                  {hotel.amenities.slice(0, 3).map((a) => HOTEL_MUST_HAVES.find((h) => h.id === a)?.label ?? a).join(" · ")}
                </p>
                <p className="font-serif text-2xl">{formatCurrency(hotel.pricePerNight)} <span className="text-sm font-sans text-muted-foreground">/ night</span></p>
                <p className="text-xs text-muted-foreground">{formatCurrency(hotel.totalPrice)} total for {nights} night{nights > 1 ? "s" : ""}</p>
              </CardContent>
            </button>
          </Card>
        ))}
      </div>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected ? (
            <div className="space-y-4 pr-6">
              <h2 className="font-serif text-2xl">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.neighborhood}, {selected.city} · {"★".repeat(selected.stars)}
              </p>
              <p>{selected.whyItFits}</p>
              <p className="text-sm">
                <span className="font-medium">Amenities: </span>
                {selected.amenities.map((a) => HOTEL_MUST_HAVES.find((h) => h.id === a)?.label ?? a).join(", ")}
              </p>
              <p className="text-sm">
                <span className="font-medium">Cancellation: </span>
                {selected.cancellationPolicy}
              </p>
              <p className="font-serif text-2xl">{formatCurrency(selected.totalPrice)}</p>
              <Button className="w-full" size="lg" onClick={() => choose(selected)}>
                Select this hotel
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

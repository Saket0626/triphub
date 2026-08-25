"use client";

/** Flight search UI — cards, filters, detail drawer, then a dedicated confirm screen. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightOption, TripBundle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { minutesToDuration } from "@/lib/labels";
import { pendingKey, setPending } from "@/lib/pending";
import { compareFlightPoints } from "@/lib/loyalty";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/dialog";
import { SectionHeader } from "@/components/wizard/progress";
import { PointsCompare } from "@/components/trip/points-compare";

type SortKey = "best" | "price" | "duration" | "stops" | "departure" | "airline";
type DateSuggestion = { departureDate: string; returnDate: string | null; flightCount: number };

function dateLabel(departureDate: string, returnDate: string | null) {
  return `${formatDate(departureDate)}${returnDate ? ` – ${formatDate(returnDate)}` : ""}`;
}

export function FlightSearch({ bundle }: { bundle: TripBundle }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [dateAdjusted, setDateAdjusted] = useState(false);
  const [originalDates, setOriginalDates] = useState({
    departureDate: bundle.trip.departureDate,
    returnDate: bundle.trip.returnDate,
  });
  const [shownDates, setShownDates] = useState({
    departureDate: bundle.trip.departureDate,
    returnDate: bundle.trip.returnDate,
  });
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [sort, setSort] = useState<SortKey>("best");
  const [stopFilter, setStopFilter] = useState<"all" | "0" | "1" | "2">("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [selected, setSelected] = useState<FlightOption | null>(null);

  async function load(dates?: { departureDate: string; returnDate: string | null }, signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: bundle.trip.id,
          ...(dates ? { departureDate: dates.departureDate, returnDate: dates.returnDate } : {}),
        }),
        signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      if (signal?.aborted) return;
      setFlights(json.flights ?? []);
      if (dates) {
        setDateAdjusted(true);
      } else if (json.dateAdjusted) {
        setDateAdjusted(true);
        if (json.originalDepartureDate) {
          setOriginalDates({
            departureDate: json.originalDepartureDate,
            returnDate: json.originalReturnDate ?? null,
          });
        }
      }
      if (json.departureDate) {
        setShownDates({ departureDate: json.departureDate, returnDate: json.returnDate ?? null });
      }
      if (Array.isArray(json.dateSuggestions) && json.dateSuggestions.length) {
        setSuggestions((prev) => {
          const next = dates ? prev : json.dateSuggestions;
          return next;
        });
      }
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    void load(undefined, ac.signal);
    return () => ac.abort();
    // First search only; later date chips call load() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle.trip.id]);

  const airlines = useMemo(() => Array.from(new Set(flights.map((f) => f.airline))), [flights]);

  const visible = useMemo(() => {
    let list = [...flights];
    if (stopFilter !== "all") list = list.filter((f) => f.stops === Number(stopFilter) || (stopFilter === "2" && f.stops >= 2));
    if (airlineFilter !== "all") list = list.filter((f) => f.airline === airlineFilter);
    list.sort((a, b) => {
      if (sort === "price") return a.totalPrice - b.totalPrice;
      if (sort === "duration") return a.durationMinutes - b.durationMinutes;
      if (sort === "stops") return a.stops - b.stops;
      if (sort === "departure") return a.departAt.localeCompare(b.departAt);
      if (sort === "airline") return a.airline.localeCompare(b.airline);
      return b.score - a.score;
    });
    return list;
  }, [flights, sort, stopFilter, airlineFilter]);

  function choose(flight: FlightOption) {
    setPending(pendingKey.flight(bundle.trip.id), flight);
    router.push(`/trip/${bundle.trip.id}/flights/confirm`);
  }

  if (loading) {
    return (
      <div className="animate-fade-up py-16 text-center">
        <p className="text-sm font-medium text-channel">One sec</p>
        <h1 className="mt-3 text-3xl font-semibold">Looking at flights for you…</h1>
        <p className="mt-3 text-muted-foreground">
          {bundle.trip.departureCode} → {bundle.trip.destinationCode} · {formatDate(shownDates.departureDate)}
          {shownDates.returnDate ? ` – ${formatDate(shownDates.returnDate)}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">If this date is thin, we’ll suggest nearby days and show those flights.</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Flights"
        title={dateAdjusted ? "Suggested dates" : "Pick a flight"}
        description={
          dateAdjusted
            ? `No real flights on ${dateLabel(originalDates.departureDate, originalDates.returnDate)}. Showing flights for ${dateLabel(shownDates.departureDate, shownDates.returnDate)}.`
            : `${bundle.trip.departureCode} → ${bundle.trip.destinationCode} · ${dateLabel(shownDates.departureDate, shownDates.returnDate)}. Sorted by what you asked for. Nothing's held until you confirm.`
        }
      />
      {dateAdjusted ? (
        <div className="mb-6 rounded-2xl border border-channel/30 bg-channel/5 px-5 py-4">
          <p className="text-sm font-medium text-channel">Suggested dates</p>
          <p className="mt-1 font-serif text-2xl text-soundings">{dateLabel(shownDates.departureDate, shownDates.returnDate)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing matched {dateLabel(originalDates.departureDate, originalDates.returnDate)}. Hotels and activities will use these suggested dates. The flights below are for this itinerary.
          </p>
          {suggestions.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => {
                const active =
                  suggestion.departureDate === shownDates.departureDate && suggestion.returnDate === shownDates.returnDate;
                return (
                  <button
                    key={`${suggestion.departureDate}-${suggestion.returnDate ?? "ow"}`}
                    type="button"
                    onClick={() => void load(suggestion)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      active ? "border-channel bg-white font-medium text-soundings" : "border-black/10 bg-white/60 text-muted-foreground"
                    }`}
                  >
                    {dateLabel(suggestion.departureDate, suggestion.returnDate)}
                    {suggestion.flightCount ? ` · ${suggestion.flightCount}` : ""}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <h2 className="mb-4 text-lg font-medium">
        {dateAdjusted ? `Flights for ${dateLabel(shownDates.departureDate, shownDates.returnDate)}` : "Available flights"}
      </h2>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="h-10 rounded-full border bg-white px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="best">Best match</option>
          <option value="price">Price</option>
          <option value="duration">Duration</option>
          <option value="stops">Stops</option>
          <option value="departure">Departure time</option>
          <option value="airline">Airline</option>
        </select>
        <select className="h-10 rounded-full border bg-white px-3 text-sm" value={stopFilter} onChange={(e) => setStopFilter(e.target.value as typeof stopFilter)}>
          <option value="all">Any stops</option>
          <option value="0">Nonstop</option>
          <option value="1">1 stop</option>
          <option value="2">2+ stops</option>
        </select>
        <select className="h-10 rounded-full border bg-white px-3 text-sm" value={airlineFilter} onChange={(e) => setAirlineFilter(e.target.value)}>
          <option value="all">Any airline</option>
          {airlines.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 px-5 py-8 text-sm text-muted-foreground">
            No real flights on these dates. We also checked nearby days. Try another airport, or a different week.
          </p>
        ) : null}
        {visible.map((flight, i) => (
          <Card key={flight.id} className={i === 0 && sort === "best" ? "ring-1 ring-primary/30" : ""}>
            <CardContent className="pt-6">
              {i === 0 && sort === "best" ? (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="recommend">Nice match</Badge>
                  <p className="text-sm text-muted-foreground">{flight.recommendReason}</p>
                </div>
              ) : null}
              <button type="button" className="w-full text-left" onClick={() => setSelected(flight)}>
                <FlightSummary flight={flight} travelers={bundle.trip.adultCount + bundle.trip.childCount} />
              </button>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${flight.airline} ${flight.flightNumber} ${flight.from} ${flight.to}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-channel hover:underline"
              >
                Check this flight on Google
              </a>
              <PointsCompare comparisons={compareFlightPoints(flight, bundle.loyaltyWallets ?? [])} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected ? (
            <div className="space-y-5 pr-6">
              <h2 className="font-serif text-2xl">Flight details</h2>
              <FlightSummary flight={selected} travelers={bundle.trip.adultCount + bundle.trip.childCount} />
              <div className="text-sm">
                <p className="font-medium">Baggage</p>
                <p className="text-muted-foreground">{selected.bags.carryOn}</p>
                <p className="text-muted-foreground">{selected.bags.checked}</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Fare rules</p>
                <p className="text-muted-foreground">{selected.fareRules}</p>
              </div>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${selected.airline} ${selected.flightNumber} ${selected.from} ${selected.to} ${selected.departAt.slice(0, 10)}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-medium text-channel hover:underline"
              >
                Check this flight on Google
              </a>
              <Button className="w-full" size="lg" onClick={() => choose(selected)}>
                Select this flight
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This doesn&apos;t book it yet. You&apos;ll confirm next.
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function FlightSummary({ flight, travelers }: { flight: FlightOption; travelers: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm font-medium">
          {flight.airline} {flight.flightNumber}
        </p>
        <p className="mt-1 font-serif text-2xl">
          {flight.departAt.slice(11, 16)} → {flight.arriveAt.slice(11, 16)}
        </p>
        <p className="text-sm text-muted-foreground">
          {flight.from} – {flight.to} · {minutesToDuration(flight.durationMinutes)} ·{" "}
          {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
          {flight.layovers.length
            ? ` (${flight.layovers.map((l) => `${l.airport}, ${minutesToDuration(l.durationMinutes)}`).join("; ")})`
            : ""}
        </p>
        {flight.returnFlight ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Return {flight.returnFlight.departAt.slice(11, 16)} → {flight.returnFlight.arriveAt.slice(11, 16)} ·{" "}
            {flight.returnFlight.from} – {flight.returnFlight.to}
          </p>
        ) : null}
        <p className="mt-2 text-xs capitalize text-muted-foreground">{flight.cabinClass.replace("_", " ")} cabin</p>
        {flight.matchTags.length ? (
          <p className="mt-2 text-sm">
            This matches your preference for: {flight.matchTags.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="text-right">
        <p className="font-serif text-2xl">{formatCurrency(flight.totalPrice)}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(flight.pricePerTraveler)} per traveler · {travelers} traveler{travelers > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

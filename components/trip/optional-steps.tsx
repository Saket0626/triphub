"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActivityOption, GroundOption, ResearchFinding, TripBundle } from "@/types";
import { generateGroundOptions } from "@/lib/mock-extras";
import { formatCurrency } from "@/lib/utils";
import { pendingKey, setPending } from "@/lib/pending";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PHOTOS } from "@/components/brand/travel-photo";
import { ChoiceCard, ConfirmActions, SectionHeader } from "@/components/wizard/progress";
import { LiveInsightBadge, PlaceMeta, SandboxNote, WorthKnowingPanel } from "@/components/trip/discovery";

const ACTIVITY_PHOTOS: Record<string, string> = {
  Tour: PHOTOS.city.src,
  Cruise: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
  "Day trip": PHOTOS.road.src,
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  Culture: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80",
  Comfort: PHOTOS.hotel.src,
  Transport: PHOTOS.car.src,
  Dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  Wellness: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
  Family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80",
  Outdoors: PHOTOS.pack.src,
  Photo: PHOTOS.city.src,
  Experience: PHOTOS.road.src,
};

export function GroundFlow({ bundle }: { bundle: TripBundle }) {
  const router = useRouter();
  const options = useMemo(() => generateGroundOptions(bundle.trip), [bundle.trip]);
  const [decision, setDecision] = useState<"undecided" | "yes" | "no" | "skip">("undecided");
  const [picked, setPicked] = useState<GroundOption | null>(null);

  function goConfirm(choice: "yes" | "no" | "skip", option: GroundOption | null) {
    setPending(pendingKey.ground(bundle.trip.id), { choice, option });
    router.push(`/trip/${bundle.trip.id}/ground/confirm`);
  }

  if (decision === "undecided") {
    return (
      <div className="animate-fade-up">
        <SectionHeader
          eyebrow="Ground transport"
          title="Need a ride?"
          description="Totally optional. Skip if you've got it covered."
        />
        <div className="grid gap-3">
          <ChoiceCard onClick={() => setDecision("yes")}>
            <p className="font-medium">Yeah, show me options</p>
            <p className="text-sm text-muted-foreground">Rideshare, a rental, a private transfer, or transit.</p>
          </ChoiceCard>
          <ChoiceCard onClick={() => goConfirm("no", null)}>
            <p className="font-medium">No thanks</p>
            <p className="text-sm text-muted-foreground">I&apos;ve got getting around covered.</p>
          </ChoiceCard>
          <ChoiceCard onClick={() => goConfirm("skip", null)}>
            <p className="font-medium">Skip for now</p>
            <p className="text-sm text-muted-foreground">You can always come back to this.</p>
          </ChoiceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Ground transport"
        title="Pick one"
        description="Tap a card, then confirm. These are estimates — nothing's reserved yet."
      />
      <div className="grid gap-3">
        {options.map((option) => (
          <ChoiceCard key={option.id} selected={picked?.id === option.id} onClick={() => setPicked(option)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{option.details}</p>
              </div>
              <p className="font-serif text-xl">{formatCurrency(option.priceEstimate)}</p>
            </div>
          </ChoiceCard>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setDecision("undecided")}>
          Back
        </Button>
        <Button disabled={!picked} onClick={() => picked && goConfirm("yes", picked)}>
          Select this option
        </Button>
      </div>
    </div>
  );
}

export function ActivitiesFlow({ bundle }: { bundle: TripBundle }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<ActivityOption[]>([]);
  const [worthKnowing, setWorthKnowing] = useState<ResearchFinding[]>([]);
  const [sandbox, setSandbox] = useState(true);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<ActivityOption[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCount, setAllCount] = useState(0);
  const [highestPrice, setHighestPrice] = useState(0);
  const [lowestPrice, setLowestPrice] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/activities/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: bundle.trip.id, query: query || undefined, page }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Search failed");
        if (!cancelled) {
          setSuggestions(json.activities ?? []);
          setWorthKnowing(json.worthKnowing ?? []);
          setSandbox(Boolean(json.sandbox));
          setLive(Boolean(json.live));
          setTotalPages(json.totalPages ?? 1);
          setAllCount(json.allCount ?? (json.activities ?? []).length);
          setHighestPrice(json.highestPrice ?? 0);
          setLowestPrice(json.lowestPrice ?? 0);
        }
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
  }, [bundle.trip.id, query, page]);

  function toggle(option: ActivityOption) {
    setPicked((cur) => (cur.some((x) => x.id === option.id) ? cur.filter((x) => x.id !== option.id) : [...cur, option]));
  }

  function go(skipped: boolean) {
    setPending(pendingKey.activities(bundle.trip.id), { skipped, options: skipped ? [] : picked });
    router.push(`/trip/${bundle.trip.id}/activities/confirm`);
  }

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Activities"
        title="Want stuff to do?"
        description="Search live tours, then pick what is actually worth it. Best value sits at the top — not always the cheapest. Nothing is added until you confirm."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="h-11 rounded-full border bg-white px-4 text-sm"
          placeholder='Try “scuba diving”, “food tour”, “sunset cruise”'
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <p className="self-center text-xs text-muted-foreground">
          {live ? "Live Viator inventory" : sandbox ? "Sample tours while sandbox is on" : "Catalog"}
        </p>
      </div>
      {highestPrice > 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {allCount} real-looking options · from {formatCurrency(lowestPrice)} to{" "}
          <span className="font-medium text-soundings">{formatCurrency(highestPrice)}</span> per person · best value first
        </p>
      ) : null}
      {sandbox ? <SandboxNote inventory="tours" research="destination" /> : null}
      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-channel">One sec</p>
          <h2 className="mt-3 text-2xl font-semibold">Looking for things to do…</h2>
        </div>
      ) : null}
      {error ? (
        <p className="mb-6 text-destructive">
          {error}{" "}
          <button type="button" className="underline" onClick={() => setPage(1)}>
            Try again
          </button>
        </p>
      ) : null}
      {!loading && suggestions.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-dashed border-black/10 px-5 py-8 text-sm text-muted-foreground">
          No tours matched {query ? `“${query}”` : "those dates"}. Try another search, or skip this step.
        </p>
      ) : null}
      <div className="grid gap-3">
        {suggestions.map((activity, index) => (
          <div key={activity.id}>
            <ChoiceCard selected={picked.some((p) => p.id === activity.id)} onClick={() => toggle(activity)}>
              <div className="flex items-start gap-4">
                <div
                  className="h-20 w-24 shrink-0 rounded-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${activity.photoUrl || ACTIVITY_PHOTOS[activity.category] || PHOTOS.city.src})`,
                  }}
                  role="img"
                  aria-label={activity.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-channel">{activity.category}</p>
                    {page === 1 && index === 0 ? (
                      <span className="rounded-full bg-channel/10 px-2 py-0.5 text-[11px] font-medium text-channel">
                        Best value
                      </span>
                    ) : null}
                    {activity.freeCancellation ? (
                      <span className="text-[11px] text-muted-foreground">Free cancellation</span>
                    ) : null}
                  </div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="mt-1 text-xs">{activity.duration}</p>
                  {activity.rating ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.rating.toFixed(1)} rating
                      {activity.reviewCount ? ` (${activity.reviewCount.toLocaleString()} reviews)` : ""}
                      {activity.productCode ? ` · ${activity.productCode}` : ""}
                    </p>
                  ) : null}
                  {activity.productUrl ? (
                    <a
                      href={activity.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-channel hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open on Viator to verify
                    </a>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  {activity.listPrice ? (
                    <p className="text-xs text-muted-foreground line-through">{formatCurrency(activity.listPrice)}</p>
                  ) : null}
                  <p className="text-xl font-semibold">{formatCurrency(activity.pricePerPerson)}</p>
                  <p className="text-xs text-muted-foreground">per person</p>
                </div>
              </div>
            </ChoiceCard>
            <div className="mt-2 space-y-2">
              {(activity.liveInsights ?? []).map((finding) => (
                <LiveInsightBadge key={finding.id} finding={finding} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
      <WorthKnowingPanel findings={worthKnowing} />
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => go(true)}>
          Skip this step
        </Button>
        <Button disabled={picked.length === 0} onClick={() => go(false)}>
          Select {picked.length || ""} {picked.length === 1 ? "activity" : "activities"}
        </Button>
      </div>
    </div>
  );
}

export function PendingConfirm({
  title,
  children,
  confirmLabel,
  onConfirm,
  onBack,
  backLabel = "Go back",
  loading,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onBack: () => void;
  backLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Confirm"
        title={title}
        description="Nothing's saved as your pick until you confirm."
      />
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
      <ConfirmActions
        confirmLabel={confirmLabel}
        onConfirm={onConfirm}
        onBack={onBack}
        backLabel={backLabel}
        loading={loading}
      />
    </div>
  );
}

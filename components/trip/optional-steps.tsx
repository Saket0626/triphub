"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActivityOption, GroundOption, TripBundle } from "@/types";
import { generateActivities, generateGroundOptions } from "@/lib/mock-extras";
import { formatCurrency } from "@/lib/utils";
import { pendingKey, setPending } from "@/lib/pending";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PHOTOS } from "@/components/brand/travel-photo";
import { ChoiceCard, ConfirmActions, SectionHeader } from "@/components/wizard/progress";

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
  const suggestions = useMemo(() => generateActivities(bundle.trip), [bundle.trip]);
  const [picked, setPicked] = useState<ActivityOption[]>([]);

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
        description="A few ideas for the destination. Skip anything. Nothing gets added until you confirm."
      />
      <div className="grid gap-3">
        {suggestions.map((activity) => (
          <ChoiceCard key={activity.id} selected={picked.some((p) => p.id === activity.id)} onClick={() => toggle(activity)}>
            <div className="flex items-start gap-4">
              <div
                className="h-20 w-24 shrink-0 rounded-xl bg-cover bg-center"
                style={{
                  backgroundImage: `url(${ACTIVITY_PHOTOS[activity.category] ?? PHOTOS.city.src})`,
                }}
                role="img"
                aria-label={activity.name}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-channel">{activity.category}</p>
                <p className="font-medium">{activity.name}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="mt-1 text-xs">{activity.duration}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-semibold">{formatCurrency(activity.pricePerPerson)}</p>
                <p className="text-xs text-muted-foreground">per person</p>
              </div>
            </div>
          </ChoiceCard>
        ))}
      </div>
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

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActivityOption, GroundOption, TripBundle } from "@/types";
import { generateActivities, generateGroundOptions } from "@/lib/mock-extras";
import { formatCurrency } from "@/lib/utils";
import { pendingKey, setPending } from "@/lib/pending";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceCard, ConfirmActions, SectionHeader } from "@/components/wizard/progress";

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
          title="Do you need airport transfers or a rental car?"
          description="This step is optional. Skipping is a real choice — we will not add anything silently."
        />
        <div className="grid gap-3">
          <ChoiceCard onClick={() => setDecision("yes")}>
            <p className="font-medium">Yes — show me options</p>
            <p className="text-sm text-muted-foreground">Rideshare, rental car, private transfer, or transit.</p>
          </ChoiceCard>
          <ChoiceCard onClick={() => goConfirm("no", null)}>
            <p className="font-medium">No — I don’t need ground transport</p>
          </ChoiceCard>
          <ChoiceCard onClick={() => goConfirm("skip", null)}>
            <p className="font-medium">Skip this step</p>
            <p className="text-sm text-muted-foreground">We’ll note “No ground transport added” on the final review.</p>
          </ChoiceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Ground transport"
        title="Pick one option"
        description="Select a card, then confirm. Estimates only — nothing is reserved yet."
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
        title="Optional things to do"
        description="Suggestions based on your destination and trip purpose. Skip freely — none are added unless you confirm."
      />
      <div className="grid gap-3">
        {suggestions.map((activity) => (
          <ChoiceCard key={activity.id} selected={picked.some((p) => p.id === activity.id)} onClick={() => toggle(activity)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{activity.category}</p>
                <p className="font-medium">{activity.name}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="mt-1 text-xs">{activity.duration}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-xl">{formatCurrency(activity.pricePerPerson)}</p>
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
  backLabel = "Go back and change something",
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
        description="This is the lock-in step. Nothing is saved as your choice until you confirm."
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

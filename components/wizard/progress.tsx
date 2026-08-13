/** Shared wizard chrome: named progress, back/next, and explicit confirm dialogs. Nothing auto-advances. */

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TripStatus } from "@/types";

export const INTAKE_STEPS = [
  { id: "basics", label: "Trip Basics" },
  { id: "travelers", label: "Travelers" },
  { id: "flights", label: "Flight Preferences" },
  { id: "review", label: "Review Basics" },
] as const;

export const JOURNEY_STEPS: { id: string; label: string; match: (path: string, status: TripStatus) => boolean; href: (id: string) => string }[] = [
  { id: "basics", label: "Basics", match: (p) => p.includes("/trip/new"), href: () => "/trip/new" },
  { id: "flights", label: "Flights", match: (p) => p.includes("/flights"), href: (id) => `/trip/${id}/flights` },
  { id: "hotels", label: "Hotels", match: (p) => p.includes("/hotels"), href: (id) => `/trip/${id}/hotels` },
  { id: "ground", label: "Ground", match: (p) => p.includes("/ground"), href: (id) => `/trip/${id}/ground` },
  { id: "activities", label: "Activities", match: (p) => p.includes("/activities"), href: (id) => `/trip/${id}/activities` },
  { id: "review", label: "Review", match: (p) => p.includes("/review") || p.includes("/confirmation"), href: (id) => `/trip/${id}/review` },
];

const STATUS_ORDER: TripStatus[] = ["draft", "flights", "hotels", "ground", "activities", "review", "booked"];

export function IntakeProgress({ current }: { current: number }) {
  return (
    <ol className="mb-12 grid grid-cols-4 gap-3">
      {INTAKE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="flex flex-col items-start gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                done || active ? "bg-channel text-white" : "bg-secondary text-pencil"
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[13px] leading-tight",
                active ? "font-medium text-soundings" : "text-pencil"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function JourneyProgress({ tripId, status }: { tripId: string; status: TripStatus }) {
  const pathname = usePathname();
  const statusIndex = STATUS_ORDER.indexOf(status);

  return (
    <nav className="mb-8 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1">
        {JOURNEY_STEPS.map((step, i) => {
          const active = step.match(pathname, status);
          const unlocked = i === 0 || i <= statusIndex;
          return (
            <li key={step.id} className="flex items-center gap-1">
              {i > 0 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
              {unlocked && tripId ? (
                <Link
                  href={step.href(tripId)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm",
                    active ? "bg-channel text-white" : "text-pencil hover:bg-secondary hover:text-soundings"
                  )}
                >
                  {i + 1}. {step.label}
                </Link>
              ) : (
                <span className="rounded-full px-3 py-1.5 text-sm text-pencil/50">
                  {i + 1}. {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  disableNext,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disableNext?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      {onNext ? (
        <Button type="button" onClick={onNext} disabled={disableNext}>
          {nextLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ConfirmActions({
  confirmLabel,
  onConfirm,
  onBack,
  backLabel = "Go back",
  loading,
  confirmVariant = "confirm",
  disabled,
}: {
  confirmLabel: string;
  onConfirm: () => void;
  onBack: () => void;
  backLabel?: string;
  loading?: boolean;
  confirmVariant?: "confirm" | "book";
  disabled?: boolean;
}) {
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
        {backLabel}
      </Button>
      <Button
        type="button"
        variant={confirmVariant}
        size="lg"
        onClick={onConfirm}
        disabled={disabled || loading}
      >
        {loading ? "Working…" : confirmLabel}
      </Button>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.18em] text-channel">{eyebrow}</p>
      ) : null}
      <h1 className="font-serif text-3xl font-normal tracking-tight text-balance text-soundings sm:text-[2.5rem] sm:leading-tight">{title}</h1>
      {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
    </header>
  );
}

export function ChoiceCard({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-black/[0.06] bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
        selected ? "border-chart ring-2 ring-chart/30" : "border-border hover:border-channel/40",
        disabled && "opacity-50"
      )}
    >
      {children}
    </button>
  );
}

export function DoneMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-chart text-book-foreground">
      <Check className="h-3 w-3" />
    </span>
  );
}

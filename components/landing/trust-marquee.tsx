"use client";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const CLAIMS = [
  {
    title: "NOTHING BOOKS WITHOUT YOU",
    caption: "every step requires your confirmation",
  },
  {
    title: "REAL PRICES, REAL TIME",
    caption: "live research, not cached guesses",
  },
  {
    title: "YOUR POINTS COUNT",
    caption: "real redemption math, every time",
  },
  {
    title: "BUILT FOR ONE TRIP AT A TIME",
    caption: "no upsells, no noise",
  },
] as const;

function Claim({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="flex w-[min(86vw,28rem)] shrink-0 flex-col justify-center px-10 py-16 text-center sm:w-[32rem] sm:px-14">
      <p className="font-sans text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.04em] text-soundings sm:text-4xl">
        {title}
      </p>
      <p className="mt-3 text-sm font-semibold text-soundings/75">{caption}</p>
    </div>
  );
}

export function TrustMarquee() {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div className="grid sm:grid-cols-2">
        {CLAIMS.map((claim) => (
          <div key={claim.title} className="border-t border-border first:border-t-0 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-t-0">
            <Claim {...claim} />
          </div>
        ))}
      </div>
    );
  }

  const loop = [...CLAIMS, ...CLAIMS];

  return (
    <div className="overflow-hidden">
      <div className="trust-marquee-track flex w-max hover:[animation-play-state:paused]">
        {loop.map((claim, i) => (
          <div key={`${claim.title}-${i}`} className="border-r border-border">
            <Claim {...claim} />
          </div>
        ))}
      </div>
    </div>
  );
}

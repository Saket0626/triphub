import type { ReactNode } from "react";
import Link from "next/link";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  landing = false,
  width = "desk",
}: {
  landing?: boolean;
  width?: "desk" | "default";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 px-5 py-3.5 sm:px-8",
          landing ? "max-w-6xl" : width === "desk" ? "max-w-desk" : "max-w-5xl"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel"
        >
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-tight text-soundings">TripHub</span>
        </Link>
        {landing ? (
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-pencil sm:flex">
            <a href="#how" className="transition-colors hover:text-soundings">
              How it works
            </a>
            <a href="#why" className="transition-colors hover:text-soundings">
              Why it&apos;s different
            </a>
          </nav>
        ) : (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-pencil">
            {env.sandboxMode ? "Sandbox" : "Live"}
          </p>
        )}
        {landing ? (
          <Button asChild size="sm">
            <Link href="/trip/new">Get started</Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}

export function PageShell({
  children,
  width = "desk",
}: {
  children: ReactNode;
  width?: "desk" | "default";
}) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader width={width} />
      <main
        className={cn(
          "mx-auto px-5 py-10 sm:px-8 sm:py-14",
          width === "desk" ? "max-w-desk" : "max-w-5xl"
        )}
      >
        {children}
      </main>
    </div>
  );
}

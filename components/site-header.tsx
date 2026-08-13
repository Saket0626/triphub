import type { ReactNode } from "react";
import Link from "next/link";
import { env } from "@/lib/env";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl tracking-tight">
          TripHub
        </Link>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {env.sandboxMode ? "Sandbox mode" : "Live"}
        </p>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

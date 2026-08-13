import Link from "next/link";
import { PageShell } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-2xl py-16 text-center animate-fade-up">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">A calmer way to book travel</p>
        <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight text-balance sm:text-6xl">
          Plan the whole trip. Confirm every step.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground text-balance">
          TripHub researches flights, hotels, ground transport, and activities — then waits. Nothing is booked
          until you say so, out loud, with a button.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/trip/new">Start a trip</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

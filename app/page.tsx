import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { BrandMark } from "@/components/brand/mark";
import { LANDING_PHOTOS, TravelPhoto } from "@/components/brand/travel-photo";
import { ResearchPhone } from "@/components/brand/research-phone";
import { TrustMarquee } from "@/components/landing/trust-marquee";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    title: "Tell us once",
    body: (
      <>
        Your dates, your budget, your must-haves. <strong className="font-bold text-soundings">One time.</strong>
      </>
    ),
  },
  {
    n: "02",
    title: "We find everything",
    body: (
      <>
        <strong className="font-bold text-soundings">Flights, hotels, transport, activities</strong> — researched and
        compared.
      </>
    ),
  },
  {
    n: "03",
    title: "You approve every step",
    body: (
      <>
        Nothing is booked without <strong className="font-bold text-soundings">your yes.</strong>
      </>
    ),
  },
  {
    n: "04",
    title: "You fly",
    body: (
      <>
        <strong className="font-bold text-soundings">Confirmed</strong>, in your inbox, done.
      </>
    ),
  },
] as const;

const FEATURES = [
  {
    lead: "Flights,",
    rest: "compared fairly",
    body: (
      <>
        Every option shown, sorted by what <strong className="font-bold text-soundings">actually matters</strong> to
        you.
      </>
    ),
    href: "/trip/new",
    link: "Search flights →",
    photo: LANDING_PHOTOS.flights,
  },
  {
    lead: "Hotels,",
    rest: "hand-picked",
    body: (
      <>
        Recommended for <strong className="font-bold text-soundings">your trip</strong>, not just the highest-rated.
      </>
    ),
    href: "/trip/new",
    link: "Browse hotels →",
    photo: LANDING_PHOTOS.hotels,
  },
  {
    lead: "Things",
    rest: "worth doing",
    body: (
      <>
        <strong className="font-bold text-soundings">Local finds and live deals</strong>, researched while you plan.
      </>
    ),
    href: "/trip/new",
    link: "See activities →",
    photo: LANDING_PHOTOS.activities,
  },
  {
    lead: "Your points,",
    rest: "put to work",
    body: (
      <>
        We tell you when they&apos;re <strong className="font-bold text-soundings">worth more than cash.</strong>
      </>
    ),
    href: "/trip/new",
    link: "Check your points →",
    photo: LANDING_PHOTOS.points,
  },
] as const;

function ArrowLink({ href, children }: { href: string; children: string }) {
  const Comp = href.startsWith("#") ? "a" : Link;
  return (
    <Comp
      href={href}
      className="mt-8 inline-block text-sm font-bold text-soundings underline decoration-channel decoration-2 underline-offset-8 transition-colors hover:text-channel"
    >
      {children}
    </Comp>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader landing />
      <main>
        <section className="relative min-h-[calc(100svh-4.25rem)]">
          <TravelPhoto
            {...LANDING_PHOTOS.hero}
            priority
            drift
            sizes="100vw"
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="w-full text-center">
              <h1 className="font-sans text-[clamp(2.6rem,7vw,6.25rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">
                You <span className="text-channel">decide.</span>
                <br />
                We handle the rest.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-[15px] font-semibold leading-relaxed text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] sm:text-base">
                Real flights, real hotels, real prices — nothing books until you say{" "}
                <span className="font-extrabold">yes.</span>
              </p>
              <div className="mt-9 flex justify-center">
                <Button asChild variant="confirm" size="xl">
                  <Link href="/trip/new">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="research" className="scroll-mt-24">
          <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-5 py-28 sm:px-10 lg:grid-cols-2 lg:gap-24 lg:px-16 lg:py-40">
            <Reveal>
              <div className="relative min-h-[520px] overflow-hidden sm:min-h-[620px] lg:min-h-[720px]">
                <TravelPhoto
                  {...LANDING_PHOTOS.research}
                  drift
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex h-full min-h-[520px] items-center justify-center p-8 sm:min-h-[620px] lg:min-h-[720px]">
                  <ResearchPhone />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="text-center lg:text-center">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-channel">
                The research engine
              </p>
              <h2 className="display-line mx-auto mt-5 max-w-[18ch] text-[clamp(2.1rem,4.6vw,4.35rem)] leading-[0.95]">
                It does the <span className="text-channel">homework.</span> You do the{" "}
                <span className="text-channel">deciding.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-md text-[15px] font-medium leading-relaxed text-soundings">
                We search live for <strong className="font-extrabold">real deals, real events, real prices.</strong>
              </p>
              <p className="mx-auto mt-3 max-w-md text-[15px] font-medium leading-relaxed text-soundings">
                You see the reasoning behind every recommendation{" "}
                <strong className="font-extrabold">before you approve it.</strong>
              </p>
              <ArrowLink href="#how">See how it works →</ArrowLink>
            </Reveal>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 border-t border-border">
          <div className="mx-auto max-w-[1440px] px-5 py-28 sm:px-10 lg:px-16 lg:py-40">
            <Reveal className="text-center">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-channel">
                How it works
              </p>
              <h2 className="display-line mx-auto mt-5 max-w-[14ch] text-[clamp(2.1rem,4.6vw,4.35rem)] leading-[0.95]">
                Four steps. <span className="text-channel">Zero</span> guesswork.
              </h2>
            </Reveal>
            <ol className="mx-auto mt-20 max-w-2xl divide-y divide-border border-y border-border">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.05}>
                  <li className="py-10 text-center lg:py-14">
                    <span className="font-sans text-2xl font-extrabold text-channel">{step.n}</span>
                    <h3 className="mt-3 text-base font-extrabold text-soundings">{step.title}</h3>
                    <p className="mt-2 text-[15px] font-medium text-soundings/80">{step.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-24">
          {FEATURES.map((feature, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={feature.lead} className="border-t border-border">
                <div
                  className={cn(
                    "mx-auto grid max-w-[1440px] items-center lg:grid-cols-2",
                    flip && "lg:[&>div:first-child]:order-2"
                  )}
                >
                  <Reveal>
                    <TravelPhoto
                      {...feature.photo}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="min-h-[70vw] w-full sm:min-h-[520px] lg:min-h-[720px]"
                    />
                  </Reveal>
                  <Reveal delay={0.08}>
                    <div className="px-5 py-20 text-center sm:px-10 lg:px-16 lg:py-0">
                      <h2 className="display-line mx-auto max-w-[14ch] text-[clamp(2rem,4vw,3.5rem)] leading-[0.95]">
                        <span className="text-channel">{feature.lead}</span> {feature.rest}
                      </h2>
                      <p className="mx-auto mt-6 max-w-sm text-[15px] font-medium leading-relaxed text-soundings">
                        {feature.body}
                      </p>
                      <ArrowLink href={feature.href}>{feature.link}</ArrowLink>
                    </div>
                  </Reveal>
                </div>
              </div>
            );
          })}
        </section>

        <section id="trust" className="scroll-mt-24 border-y border-border bg-secondary/50">
          <Reveal>
            <TrustMarquee />
          </Reveal>
        </section>

        <section className="px-5 py-32 sm:px-10 lg:px-16 lg:py-44">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="display-line text-[clamp(2.4rem,5.6vw,5.25rem)] leading-[0.92]">
                Your trip is <span className="text-channel">one step</span> away.
              </h2>
              <p className="mt-6 text-[15px] font-semibold text-soundings">Tell us where you&apos;re going.</p>
              <Button asChild variant="confirm" size="xl" className="mt-10">
                <Link href="/trip/new">Get Started</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="font-extrabold tracking-tight">TripHub</span>
        </div>
        <p className="text-sm font-semibold text-soundings">
          Nothing books until you say <span className="text-channel">yes.</span>
        </p>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { BrandMark } from "@/components/brand/mark";
import { PHOTOS, TravelPhoto } from "@/components/brand/travel-photo";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    title: "Tell us the trip",
    body: "Where you're going, when, and who's coming. Takes a couple of minutes.",
    photo: PHOTOS.pack,
  },
  {
    n: "02",
    title: "Pick flights",
    body: "We show options that match what you asked for. You choose the one you want.",
    photo: PHOTOS.plane,
  },
  {
    n: "03",
    title: "Find a stay",
    body: "Hotels that fit the dates and the vibe. Same deal — you pick.",
    photo: PHOTOS.hotel,
  },
  {
    n: "04",
    title: "Add extras if you want",
    body: "Rides, tours, whatever. Skip anything you don't need.",
    photo: PHOTOS.city,
  },
];

const INCLUDED = [
  { title: "Flights", body: "Ranked to the seats, stops, and budget you actually asked for." },
  { title: "Hotels", body: "Stays that line up with your dates — nothing pre-selected." },
  { title: "Rides", body: "Airport transfers or a rental, only if you want them." },
  { title: "Things to do", body: "A few ideas for the destination. Easy to skip." },
];

const WHY = [
  {
    n: "01",
    title: "It's all in one place",
    body: "Flights, hotels, and extras live on one trip. No bouncing between five tabs.",
  },
  {
    n: "02",
    title: "You pick, then we book",
    body: "Nothing gets charged or reserved until you hit confirm. Take your time.",
  },
  {
    n: "03",
    title: "Change your mind",
    body: "Go back, swap a hotel, drop a transfer. Nothing's locked until the end.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader landing />
      <main>
        <section className="hero-wash">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pb-28 lg:pt-20">
            <Reveal>
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-channel">
                Trip planning, simplified
              </p>
              <h1 className="mt-5 font-serif text-[2.75rem] leading-[1.08] tracking-tight text-soundings text-balance sm:text-6xl lg:text-[4.15rem]">
                Everything you need to plan a trip,{" "}
                <em className="italic">all in one place.</em>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-pencil">
                Flights, hotels, rides, and fun stuff to do. Tell us the trip, pick what you like, and
                nothing gets booked until you&apos;re ready.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild variant="confirm" size="xl">
                  <Link href="/trip/new">Start planning</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
                <TravelPhoto
                  {...PHOTOS.hero}
                  caption="The trip"
                  priority
                  sizes="(max-width: 1024px) 70vw, 36vw"
                  className="col-span-2 aspect-[16/10] rounded-[1.75rem] sm:aspect-[2/1] lg:col-span-1 lg:row-span-2 lg:aspect-auto lg:h-full lg:min-h-[420px]"
                />
                <TravelPhoto
                  {...PHOTOS.plane}
                  caption="Flights"
                  sizes="(max-width: 1024px) 50vw, 22vw"
                  className="aspect-[4/3] rounded-[1.5rem] lg:aspect-auto lg:h-full"
                />
                <TravelPhoto
                  {...PHOTOS.hotel}
                  caption="Stays"
                  sizes="(max-width: 1024px) 50vw, 22vw"
                  className="aspect-[4/3] rounded-[1.5rem] lg:aspect-auto lg:h-full"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border">
          <div className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div
                  className={cn(
                    "px-5 py-9 sm:px-8",
                    i > 0 && "border-t border-border sm:border-t-0",
                    (i === 1 || i === 3) && "sm:border-l",
                    i >= 2 && "lg:border-t-0",
                    i > 0 && "lg:border-l"
                  )}
                >
                  <p className="font-serif text-2xl text-soundings">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-pencil">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24 bg-secondary/60">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <Reveal>
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-channel">
                How it works
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight tracking-tight text-soundings sm:text-5xl">
                Four steps. You stay in the driver&apos;s seat.
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.06}>
                  <article className="overflow-hidden rounded-[1.75rem] border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="relative">
                      <TravelPhoto
                        {...step.photo}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="aspect-[16/10] w-full"
                      />
                      <span className="absolute left-5 top-5 font-serif text-3xl text-white drop-shadow-sm">
                        {step.n}
                      </span>
                    </div>
                    <div className="p-6 sm:p-7">
                      <h3 className="font-serif text-2xl text-soundings">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-pencil">{step.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="scroll-mt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <Reveal>
              <TravelPhoto
                {...PHOTOS.villa}
                caption="Your call, all the way through"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/5] w-full rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </Reveal>
            <div>
              <Reveal>
                <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-channel">
                  Why TripHub
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-soundings sm:text-5xl">
                  Plan the whole thing without the usual booking stress.
                </h2>
              </Reveal>
              <ol className="mt-10 space-y-8">
                {WHY.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.06}>
                    <li className="grid grid-cols-[auto_1fr] gap-5 border-t border-border pt-8 first:border-t-0 first:pt-0">
                      <span className="font-serif text-xl text-channel">{item.n}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-soundings">{item.title}</h3>
                        <p className="mt-2 leading-relaxed text-pencil">{item.body}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
              <TravelPhoto
                {...PHOTOS.road}
                sizes="100vw"
                className="min-h-[380px] w-full sm:min-h-[440px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/15" />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-8 sm:p-14">
                <h2 className="max-w-lg font-serif text-4xl leading-tight tracking-tight text-white text-balance sm:text-5xl">
                  Ready when you are.
                </h2>
                <p className="mt-3 max-w-md text-base text-white/85">
                  Start with the basics. We&apos;ll help with the rest.
                </p>
                <Button asChild size="xl" className="mt-8 bg-white text-soundings shadow-none hover:bg-white/90">
                  <Link href="/trip/new">Start planning</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="font-semibold tracking-tight">TripHub</span>
        </div>
        <p className="text-sm text-pencil">Everything you need to plan a trip, all in one place.</p>
      </footer>
    </div>
  );
}

/** Sandbox mock flight generator — ~8–12 varied options matching the trip route and dates. */

import type { FlightOption, FlightSegment, Trip, TripPreferences } from "@/types";
import { generateId } from "@/lib/utils";
import { timeWindowForHour } from "@/lib/labels";

const CARRIERS = [
  { name: "Delta", code: "DL" },
  { name: "United", code: "UA" },
  { name: "American", code: "AA" },
  { name: "JetBlue", code: "B6" },
  { name: "Alaska", code: "AS" },
  { name: "Southwest", code: "WN" },
] as const;

const LAYOVER_HUBS = ["ATL", "ORD", "DFW", "DEN", "CLT", "PHX", "MSP"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function atDate(date: string, hour: number, minute: number) {
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

function addMinutes(isoLocal: string, minutes: number) {
  const [datePart, timePart] = isoLocal.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const dt = new Date(y, mo - 1, d, h, mi);
  dt.setMinutes(dt.getMinutes() + minutes);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function cabinMultiplier(cabin: TripPreferences["cabinClass"]) {
  switch (cabin) {
    case "premium_economy":
      return 1.7;
    case "business":
      return 4;
    case "first":
      return 6;
    default:
      return 1;
  }
}

function scoreAndTag(option: FlightOption, prefs: TripPreferences, travelerCount: number): FlightOption {
  const tags: string[] = [];
  let score = 50;
  const hour = Number(option.departAt.slice(11, 13));
  const window = timeWindowForHour(hour);

  if (prefs.maxStops === "none" && option.stops === 0) {
    tags.push("nonstop");
    score += 22;
  } else if (prefs.maxStops === "one" && option.stops <= 1) {
    tags.push("within your stop limit");
    score += 12;
  } else if (option.stops === 0) {
    tags.push("nonstop");
    score += 10;
  }

  if (prefs.outboundTimeWindow !== "no_preference" && window === prefs.outboundTimeWindow) {
    tags.push(`${prefs.outboundTimeWindow.replace("_", " ")} departure`);
    score += 16;
  }

  if (
    !prefs.noAirlinePreference &&
    prefs.preferredAirlines.some((a) => a.toLowerCase() === option.airline.toLowerCase())
  ) {
    tags.push(`preferred airline (${option.airline})`);
    score += 14;
  }

  if (option.pricePerTraveler <= prefs.budgetMax) {
    const under = prefs.budgetMax - option.pricePerTraveler;
    if (under >= 50) {
      tags.push(`$${under} under budget`);
      score += 18;
    } else {
      tags.push("within budget");
      score += 8;
    }
  } else {
    score -= 20;
  }

  if (option.pricePerTraveler >= prefs.budgetMin && option.pricePerTraveler <= prefs.budgetMax) {
    score += 6;
  }

  tags.push(`${option.cabinClass.replace("_", " ")} cabin`);

  const reasons: string[] = [];
  if (option.stops === 0) reasons.push("Nonstop");
  if (prefs.outboundTimeWindow !== "no_preference" && window === prefs.outboundTimeWindow) {
    reasons.push(`departs in your preferred ${prefs.outboundTimeWindow.replace("_", " ")} window`);
  }
  const under = prefs.budgetMax - option.pricePerTraveler;
  if (under > 0) reasons.push(`$${under} under your per-ticket budget`);
  const recommendReason =
    reasons.length > 0
      ? `${reasons[0]}${reasons.length > 1 ? `, ${reasons.slice(1).join(", ")}` : ""}.`
      : "A solid match across price, timing, and comfort.";

  return {
    ...option,
    matchTags: tags,
    score,
    recommendReason,
    totalPrice: option.pricePerTraveler * travelerCount + (option.returnFlight ? 0 : 0),
  };
}

export function generateMockFlights(trip: Trip, prefs: TripPreferences): FlightOption[] {
  const seed = hash(`${trip.id}-${trip.departureDate}-${trip.destinationCode}`);
  const travelers = trip.adultCount + trip.childCount;
  const multiplier = cabinMultiplier(prefs.cabinClass);
  const base = 190 + (seed % 80);
  const templates: Array<{
    carrier: (typeof CARRIERS)[number];
    hour: number;
    minute: number;
    duration: number;
    stops: number;
    priceJitter: number;
    flightNum: number;
  }> = [
    { carrier: CARRIERS[0], hour: 6, minute: 15, duration: 315, stops: 0, priceJitter: 40, flightNum: 412 },
    { carrier: CARRIERS[1], hour: 8, minute: 40, duration: 328, stops: 0, priceJitter: 20, flightNum: 1588 },
    { carrier: CARRIERS[2], hour: 11, minute: 5, duration: 340, stops: 0, priceJitter: -10, flightNum: 233 },
    { carrier: CARRIERS[3], hour: 13, minute: 20, duration: 355, stops: 0, priceJitter: 70, flightNum: 901 },
    { carrier: CARRIERS[4], hour: 17, minute: 45, duration: 322, stops: 0, priceJitter: 15, flightNum: 720 },
    { carrier: CARRIERS[5], hour: 21, minute: 10, duration: 310, stops: 0, priceJitter: -40, flightNum: 1844 },
    { carrier: CARRIERS[0], hour: 7, minute: 5, duration: 455, stops: 1, priceJitter: -55, flightNum: 88 },
    { carrier: CARRIERS[1], hour: 9, minute: 50, duration: 510, stops: 1, priceJitter: -80, flightNum: 642 },
    { carrier: CARRIERS[2], hour: 15, minute: 30, duration: 490, stops: 1, priceJitter: -30, flightNum: 1201 },
    { carrier: CARRIERS[3], hour: 19, minute: 15, duration: 620, stops: 2, priceJitter: -110, flightNum: 55 },
    { carrier: CARRIERS[4], hour: 5, minute: 50, duration: 300, stops: 0, priceJitter: 90, flightNum: 333 },
    { carrier: CARRIERS[0], hour: 16, minute: 10, duration: 335, stops: 0, priceJitter: 5, flightNum: 1776 },
  ];

  const options = templates.map((t, index) => {
    const departAt = atDate(trip.departureDate, t.hour, t.minute);
    const arriveAt = addMinutes(departAt, t.duration);
    const price = Math.round((base + t.priceJitter) * multiplier);
    const hub = LAYOVER_HUBS[(seed + index) % LAYOVER_HUBS.length];
    const layovers =
      t.stops === 0
        ? []
        : t.stops === 1
          ? [{ airport: hub, durationMinutes: 55 + (index % 4) * 15 }]
          : [
              { airport: hub, durationMinutes: 48 },
              { airport: LAYOVER_HUBS[(seed + index + 3) % LAYOVER_HUBS.length], durationMinutes: 62 },
            ];

    const segments: FlightSegment[] = [];
    if (t.stops === 0) {
      segments.push({
        airline: t.carrier.name,
        airlineCode: t.carrier.code,
        flightNumber: `${t.carrier.code}${t.flightNum}`,
        from: trip.departureCode,
        to: trip.destinationCode,
        departAt,
        arriveAt,
        durationMinutes: t.duration,
      });
    } else {
      const firstLeg = Math.round(t.duration * 0.45);
      const mid = addMinutes(departAt, firstLeg);
      segments.push({
        airline: t.carrier.name,
        airlineCode: t.carrier.code,
        flightNumber: `${t.carrier.code}${t.flightNum}`,
        from: trip.departureCode,
        to: layovers[0].airport,
        departAt,
        arriveAt: mid,
        durationMinutes: firstLeg,
      });
      const secondStart = addMinutes(mid, layovers[0].durationMinutes);
      segments.push({
        airline: t.carrier.name,
        airlineCode: t.carrier.code,
        flightNumber: `${t.carrier.code}${t.flightNum + 17}`,
        from: layovers[0].airport,
        to: t.stops === 1 ? trip.destinationCode : layovers[1].airport,
        departAt: secondStart,
        arriveAt: t.stops === 1 ? arriveAt : addMinutes(secondStart, 90),
        durationMinutes: t.stops === 1 ? t.duration - firstLeg - layovers[0].durationMinutes : 90,
      });
    }

    const outbound: FlightOption = {
      id: generateId(),
      airline: t.carrier.name,
      airlineCode: t.carrier.code,
      flightNumber: `${t.carrier.code}${t.flightNum}`,
      from: trip.departureCode,
      to: trip.destinationCode,
      departAt,
      arriveAt,
      durationMinutes: t.duration,
      stops: t.stops,
      layovers,
      segments,
      cabinClass: prefs.cabinClass,
      pricePerTraveler: price,
      totalPrice: price * travelers,
      currency: "USD",
      bags: {
        carryOn: "1 personal item + 1 carry-on included",
        checked: prefs.cabinClass === "economy" ? "First checked bag from $35" : "2 checked bags included",
      },
      fareRules:
        prefs.cabinClass === "economy"
          ? "Main cabin fare. Changes allowed with a fee plus any fare difference. Cancel for a credit minus $99 within 24 hours of booking; after that, non-refundable."
          : "Flexible fare. Changes without penalty. Fully refundable up to 24 hours before departure.",
      matchTags: [],
      score: 0,
    };

    if (trip.tripType === "round_trip" && trip.returnDate) {
      const retHour = (t.hour + 3) % 24;
      const retDepart = atDate(trip.returnDate, retHour, (t.minute + 10) % 60);
      const retArrive = addMinutes(retDepart, t.duration + 12);
      outbound.returnFlight = {
        airline: t.carrier.name,
        airlineCode: t.carrier.code,
        flightNumber: `${t.carrier.code}${t.flightNum + 200}`,
        from: trip.destinationCode,
        to: trip.departureCode,
        departAt: retDepart,
        arriveAt: retArrive,
        durationMinutes: t.duration + 12,
        stops: t.stops,
        layovers,
        segments: [
          {
            airline: t.carrier.name,
            airlineCode: t.carrier.code,
            flightNumber: `${t.carrier.code}${t.flightNum + 200}`,
            from: trip.destinationCode,
            to: trip.departureCode,
            departAt: retDepart,
            arriveAt: retArrive,
            durationMinutes: t.duration + 12,
          },
        ],
        cabinClass: prefs.cabinClass,
        pricePerTraveler: 0,
        totalPrice: 0,
        currency: "USD",
        bags: outbound.bags,
        fareRules: outbound.fareRules,
        matchTags: [],
        score: 0,
      };
      outbound.pricePerTraveler = price * 2;
      outbound.totalPrice = outbound.pricePerTraveler * travelers;
    }

    return scoreAndTag(outbound, prefs, travelers);
  });

  return options.sort((a, b) => b.score - a.score);
}

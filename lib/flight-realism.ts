/** Drop Duffel-test itineraries that reuse well-known flight numbers on the wrong city pair. */

import { isUsAirport } from "@/lib/airports";
import type { FlightOption, Trip } from "@/types";

const KNOWN_ROUTES: Record<string, Array<{ from: string; to: string }>> = {
  AA107: [{ from: "LHR", to: "JFK" }],
  AA106: [{ from: "JFK", to: "LHR" }],
  BA105: [{ from: "LHR", to: "DXB" }],
  BA104: [{ from: "DXB", to: "LHR" }],
  BA107: [{ from: "LHR", to: "JFK" }],
  BA106: [{ from: "JFK", to: "LHR" }],
  CM812: [{ from: "JFK", to: "PTY" }],
  CM811: [{ from: "PTY", to: "JFK" }],
};

/** Carriers that do not operate US-to-US scheduled service as the marketing airline. */
const NOT_US_DOMESTIC = new Set([
  "BA", "LH", "AF", "KL", "EK", "QR", "EY", "SQ", "CX", "TK", "EI", "IB", "AY",
  "VS", "LX", "OS", "SK", "AZ", "TP", "JL", "NH", "KE", "OZ",
  "CM", "AV", "LA", "AM", "AR", "G3", "H2", "JJ",
]);

const MIN_NONSTOP: Record<string, number> = {
  JFKHNL: 540,
  HNLJFK: 540,
  LAXHNL: 300,
  HNLLAX: 300,
  SFOHNL: 300,
  HNLSFO: 300,
};

function digits(flightNumber: string) {
  return flightNumber.replace(/\D/g, "").replace(/^0+/, "") || "0";
}

function flightKey(airlineCode: string, flightNumber: string) {
  return `${airlineCode.toUpperCase()}${digits(flightNumber)}`;
}

export function isImplausibleFlight(flight: FlightOption, trip: Trip) {
  const key = flightKey(flight.airlineCode, flight.flightNumber);
  const known = KNOWN_ROUTES[key];
  if (known && !known.some((route) => route.from === flight.from && route.to === flight.to)) {
    return true;
  }
  if (flight.from !== trip.departureCode || flight.to !== trip.destinationCode) return true;
  const airline = flight.airlineCode.toUpperCase();
  if (
    NOT_US_DOMESTIC.has(airline) &&
    isUsAirport(flight.from) &&
    isUsAirport(flight.to)
  ) {
    return true;
  }
  const pair = `${flight.from}${flight.to}`;
  const min = MIN_NONSTOP[pair];
  if (min && flight.stops === 0 && flight.durationMinutes < min) return true;
  return false;
}

export function collapseFlights(flights: FlightOption[]) {
  const groups = new Map<string, FlightOption[]>();
  for (const flight of flights) {
    const key = `${flight.airlineCode}-${digits(flight.flightNumber)}-${flight.departAt}`;
    const list = groups.get(key) ?? [];
    list.push(flight);
    groups.set(key, list);
  }
  const collapsed: FlightOption[] = [];
  Array.from(groups.values()).forEach((list) => {
    list.sort((a, b) => a.totalPrice - b.totalPrice);
    collapsed.push(...list.slice(0, 4));
  });
  return collapsed;
}

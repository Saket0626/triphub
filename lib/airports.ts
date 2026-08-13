/** Major US airports used by the trip-intake autocomplete until live airport search is wired. */

import type { Airport } from "@/types";

export const AIRPORTS: Airport[] = [
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International", country: "USA" },
  { code: "BOS", city: "Boston", name: "Boston Logan International", country: "USA" },
  { code: "BWI", city: "Baltimore", name: "Baltimore/Washington International", country: "USA" },
  { code: "CLT", city: "Charlotte", name: "Charlotte Douglas International", country: "USA" },
  { code: "DEN", city: "Denver", name: "Denver International", country: "USA" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International", country: "USA" },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan Wayne County", country: "USA" },
  { code: "EWR", city: "Newark", name: "Newark Liberty International", country: "USA" },
  { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International", country: "USA" },
  { code: "HNL", city: "Honolulu", name: "Daniel K. Inouye International", country: "USA" },
  { code: "IAD", city: "Washington, D.C.", name: "Washington Dulles International", country: "USA" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "USA" },
  { code: "JFK", city: "New York", name: "John F. Kennedy International", country: "USA" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International", country: "USA" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International", country: "USA" },
  { code: "LGA", city: "New York", name: "LaGuardia", country: "USA" },
  { code: "MCO", city: "Orlando", name: "Orlando International", country: "USA" },
  { code: "MDW", city: "Chicago", name: "Chicago Midway International", country: "USA" },
  { code: "MIA", city: "Miami", name: "Miami International", country: "USA" },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International", country: "USA" },
  { code: "ORD", city: "Chicago", name: "Chicago O'Hare International", country: "USA" },
  { code: "PDX", city: "Portland", name: "Portland International", country: "USA" },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia International", country: "USA" },
  { code: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor International", country: "USA" },
  { code: "SAN", city: "San Diego", name: "San Diego International", country: "USA" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International", country: "USA" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International", country: "USA" },
  { code: "SJC", city: "San Jose", name: "Norman Y. Mineta San Jose International", country: "USA" },
  { code: "SLC", city: "Salt Lake City", name: "Salt Lake City International", country: "USA" },
  { code: "TPA", city: "Tampa", name: "Tampa International", country: "USA" },
  { code: "AUS", city: "Austin", name: "Austin-Bergstrom International", country: "USA" },
  { code: "BNA", city: "Nashville", name: "Nashville International", country: "USA" },
  { code: "RDU", city: "Raleigh", name: "Raleigh-Durham International", country: "USA" },
  { code: "MSY", city: "New Orleans", name: "Louis Armstrong New Orleans International", country: "USA" },
  { code: "STL", city: "St. Louis", name: "St. Louis Lambert International", country: "USA" },
  { code: "MCI", city: "Kansas City", name: "Kansas City International", country: "USA" },
  { code: "CLE", city: "Cleveland", name: "Cleveland Hopkins International", country: "USA" },
  { code: "PIT", city: "Pittsburgh", name: "Pittsburgh International", country: "USA" },
  { code: "IND", city: "Indianapolis", name: "Indianapolis International", country: "USA" },
  { code: "CMH", city: "Columbus", name: "John Glenn Columbus International", country: "USA" },
  { code: "SMF", city: "Sacramento", name: "Sacramento International", country: "USA" },
  { code: "OAK", city: "Oakland", name: "San Francisco Bay Oakland International", country: "USA" },
  { code: "SNA", city: "Orange County", name: "John Wayne Airport", country: "USA" },
  { code: "BUR", city: "Burbank", name: "Hollywood Burbank Airport", country: "USA" },
  { code: "RSW", city: "Fort Myers", name: "Southwest Florida International", country: "USA" },
  { code: "PBI", city: "West Palm Beach", name: "Palm Beach International", country: "USA" },
  { code: "ANC", city: "Anchorage", name: "Ted Stevens Anchorage International", country: "USA" },
  { code: "ABQ", city: "Albuquerque", name: "Albuquerque International Sunport", country: "USA" },
];

export function airportLabel(airport: Airport) {
  return `${airport.city} (${airport.code}) — ${airport.name}`;
}

export function findAirport(code: string) {
  return AIRPORTS.find((a) => a.code === code);
}

export function searchAirports(query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, limit);
  return AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  ).slice(0, limit);
}

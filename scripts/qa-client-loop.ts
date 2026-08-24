/**
 * 25+ randomized live trips against production: create, flights, activities, scuba.
 * Run: npx tsx scripts/qa-client-loop.ts
 */

const BASE = process.env.TRIPHUB_URL || "https://triphub-production-0ce1.up.railway.app";

const ROUTES: Array<[string, string, string, string]> = [
  ["JFK", "New York (JFK)", "HNL", "Honolulu (HNL)"],
  ["LAX", "Los Angeles (LAX)", "HNL", "Honolulu (HNL)"],
  ["SFO", "San Francisco (SFO)", "OGG", "Kahului (OGG)"],
  ["SEA", "Seattle (SEA)", "HNL", "Honolulu (HNL)"],
  ["ORD", "Chicago (ORD)", "CUN", "Cancun (CUN)"],
  ["MIA", "Miami (MIA)", "SJU", "San Juan (SJU)"],
  ["BOS", "Boston (BOS)", "MIA", "Miami (MIA)"],
  ["DFW", "Dallas (DFW)", "LAS", "Las Vegas (LAS)"],
  ["ATL", "Atlanta (ATL)", "MCO", "Orlando (MCO)"],
  ["DEN", "Denver (DEN)", "PHX", "Phoenix (PHX)"],
  ["JFK", "New York (JFK)", "LAX", "Los Angeles (LAX)"],
  ["EWR", "Newark (EWR)", "SFO", "San Francisco (SFO)"],
  ["BOS", "Boston (BOS)", "FLL", "Fort Lauderdale (FLL)"],
  ["IAD", "Washington (IAD)", "CUN", "Cancun (CUN)"],
  ["LAX", "Los Angeles (LAX)", "LAS", "Las Vegas (LAS)"],
  ["SFO", "San Francisco (SFO)", "SEA", "Seattle (SEA)"],
  ["ORD", "Chicago (ORD)", "MIA", "Miami (MIA)"],
  ["JFK", "New York (JFK)", "MCO", "Orlando (MCO)"],
  ["PHX", "Phoenix (PHX)", "SAN", "San Diego (SAN)"],
  ["DTW", "Detroit (DTW)", "LAS", "Las Vegas (LAS)"],
  ["MSP", "Minneapolis (MSP)", "DEN", "Denver (DEN)"],
  ["CLT", "Charlotte (CLT)", "BOS", "Boston (BOS)"],
  ["AUS", "Austin (AUS)", "LAX", "Los Angeles (LAX)"],
  ["PDX", "Portland (PDX)", "SFO", "San Francisco (SFO)"],
  ["JFK", "New York (JFK)", "SJU", "San Juan (SJU)"],
  ["LAX", "Los Angeles (LAX)", "KOA", "Kailua-Kona (KOA)"],
  ["SEA", "Seattle (SEA)", "ANC", "Anchorage (ANC)"],
  ["BOS", "Boston (BOS)", "SJU", "San Juan (SJU)"],
  ["EWR", "Newark (EWR)", "MIA", "Miami (MIA)"],
  ["ORD", "Chicago (ORD)", "LAS", "Las Vegas (LAS)"],
];

function payload(from: string, fromLabel: string, to: string, toLabel: string, i: number) {
  const dep = new Date(Date.UTC(2026, 10, 3 + (i % 12)));
  const ret = new Date(dep);
  ret.setUTCDate(ret.getUTCDate() + 6 + (i % 4));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    departureCode: from,
    departureLabel: fromLabel,
    destinationCode: to,
    destinationLabel: toLabel,
    tripType: "round_trip",
    departureDate: iso(dep),
    returnDate: iso(ret),
    flexibleDates: false,
    tripPurpose: "vacation",
    contactEmail: `qa.client.${i}@example.com`,
    adultCount: 1 + (i % 2),
    childCount: 0,
    travelers: Array.from({ length: 1 + (i % 2) }, (_, n) => ({
      fullName: n === 0 ? "Alex Rivera" : "Jordan Lee",
      dateOfBirth: n === 0 ? "1992-04-12" : "1994-08-03",
      type: "adult",
      age: null,
    })),
    loyaltyWallets: [],
    cabinClass: "economy",
    preferredAirlines: [],
    noAirlinePreference: true,
    maxStops: "no_preference",
    outboundTimeWindow: "no_preference",
    returnTimeWindow: "no_preference",
    budgetMin: 200,
    budgetMax: 4000,
    seatPreference: "no_preference",
  };
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(55_000),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

async function runOne(i: number) {
  const route = ROUTES[i % ROUTES.length];
  const [from, fromLabel, to, toLabel] = route;
  const problems: string[] = [];
  const created = await post("/api/trips", payload(from, fromLabel, to, toLabel, i));
  const tripId = String(created.json.id ?? "");
  if (!created.ok || !tripId) {
    return { i, route: `${from}-${to}`, ok: false, problems: [`create ${created.status} ${JSON.stringify(created.json)}`] };
  }

  const flights = await post("/api/flights/search", { tripId });
  const flightList = Array.isArray(flights.json.flights) ? (flights.json.flights as Array<Record<string, unknown>>) : [];
  if (!flights.ok) problems.push(`flights ${flights.status} ${String(flights.json.error ?? "")}`);
  if (flights.ok && flightList.length === 0) problems.push("no flights");
  for (const f of flightList) {
    const num = `${String(f.airlineCode ?? "")}${String(f.flightNumber ?? "")}`.replace(/\s/g, "").toUpperCase();
    if (num === "AA107" && from === "JFK" && to === "HNL") problems.push("fake AA107 JFK-HNL");
    if (String(f.airlineCode ?? "").toUpperCase() === "ZZ") problems.push("Duffel ZZ airline");
    if (String(f.from) !== from || String(f.to) !== to) problems.push(`wrong city pair ${f.from}-${f.to}`);
  }

  const acts = await post("/api/activities/search", { tripId, page: 1 });
  const items = Array.isArray(acts.json.activities) ? (acts.json.activities as Array<Record<string, unknown>>) : [];
  const allCount = Number(acts.json.allCount ?? 0);
  const highest = Number(acts.json.highestPrice ?? 0);
  const lowest = Number(acts.json.lowestPrice ?? 0);
  if (!acts.ok) problems.push(`activities ${acts.status} ${String(acts.json.error ?? "")}`);
  if (acts.ok && allCount === 0) problems.push("no activities");
  if (highest && lowest && highest < lowest) problems.push("highest < lowest");
  if (acts.json.live !== true) problems.push("activities not live");
  const fakeNames = items.filter((a) => String(a.name ?? "").includes("Atelier") || String(a.source) === "mock");
  if (fakeNames.length) problems.push("mock/fake activity in live list");

  const scuba = await post("/api/activities/search", { tripId, query: "scuba diving", page: 1 });
  const scubaItems = Array.isArray(scuba.json.activities)
    ? (scuba.json.activities as Array<Record<string, unknown>>)
    : [];
  const scubaCount = Number(scuba.json.allCount ?? 0);
  const water = ["HNL", "OGG", "KOA", "CUN", "SJU", "MIA", "FLL"].includes(to);
  if (water && !scuba.ok) problems.push(`scuba search failed ${scuba.status} ${String(scuba.json.error ?? "")}`);
  if (water && scuba.ok && scubaCount === 0) problems.push("scuba empty at water dest");
  if (scuba.ok && scubaItems.some((a) => !/scuba|padi/i.test(`${a.name} ${a.category}`))) {
    problems.push(`scuba leak: ${String(scubaItems[0]?.name ?? "")}`);
  }
  if (water && scuba.ok && scubaCount > 8 && Number(scuba.json.totalPages ?? 1) < 2) {
    problems.push("scuba should paginate");
  }

  return {
    i,
    tripId,
    route: `${from}-${to}`,
    ok: problems.length === 0,
    problems,
    flights: flightList.length,
    activities: allCount,
    scuba: scubaCount,
    highest,
    topFlight: flightList[0] ? `${flightList[0].airline} ${flightList[0].flightNumber}` : "",
    topAct: items[0] ? `${items[0].name} $${items[0].pricePerPerson}` : "",
    topScuba: scubaItems[0] ? `${scubaItems[0].name} $${scubaItems[0].pricePerPerson}` : "",
  };
}

async function main() {
  const results = [];
  for (let i = 0; i < 30; i++) {
    try {
      results.push(await runOne(i));
    } catch (error) {
      results.push({
        i,
        ok: false,
        problems: [error instanceof Error ? error.message : String(error)],
      });
    }
    console.log(JSON.stringify(results[results.length - 1]));
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(JSON.stringify({ ok, of: results.length, failed: results.filter((r) => !r.ok) }, null, 2));
  if (ok < 20) process.exit(1);
}

main();

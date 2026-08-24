import { mockViatorProducts, mapViatorProduct } from "../lib/viator";
import { activityMatchesQuery, paginateActivities, rankActivities } from "../lib/activity-rank";
import type { Trip } from "../types";

const trip: Trip = {
  id: "qa",
  status: "activities",
  tripType: "round_trip",
  departureCode: "JFK",
  departureLabel: "New York (JFK)",
  destinationCode: "HNL",
  destinationLabel: "Honolulu (HNL)",
  additionalCities: null,
  departureDate: "2026-10-12",
  returnDate: "2026-10-19",
  flexibleDates: false,
  flexibleDays: null,
  tripPurpose: "vacation",
  contactEmail: "qa@example.com",
  adultCount: 2,
  childCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const all = rankActivities(mockViatorProducts(trip).map((p) => mapViatorProduct(p, 2)));
const scuba = rankActivities(all.filter((a) => activityMatchesQuery(a, "scuba-diving")));
const pages = paginateActivities(scuba, 1);

const problems: string[] = [];
if (scuba.length < 12) problems.push(`expected 12+ scuba options, got ${scuba.length}`);
if (pages.totalPages < 2) problems.push(`expected multiple pages, got ${pages.totalPages}`);
if (pages.highestPrice < pages.lowestPrice) problems.push("highest price should sit above lowest");
if ((scuba[0]?.valueScore ?? 0) < (scuba[scuba.length - 1]?.valueScore ?? 0)) {
  problems.push("best value should be first, not last");
}
const cheapest = [...scuba].sort((a, b) => a.pricePerPerson - b.pricePerPerson)[0];
if (scuba[0]?.id === cheapest?.id && scuba.length > 3 && (scuba[0]?.rating ?? 0) < 4.6) {
  problems.push("top result looks like cheapest-only ranking");
}
if (scuba.some((a) => a.pricePerPerson <= 0)) problems.push("found a $0 activity");

console.log(
  JSON.stringify(
    {
      total: all.length,
      scuba: scuba.length,
      pages: pages.totalPages,
      highestPrice: pages.highestPrice,
      lowestPrice: pages.lowestPrice,
      top: scuba.slice(0, 3).map((a) => ({
        name: a.name,
        price: a.pricePerPerson,
        rating: a.rating,
        valueReason: a.valueReason,
      })),
      ok: problems.length === 0,
      problems,
    },
    null,
    2
  )
);
if (problems.length) process.exit(1);

/**
 * Approximate public cents-per-point valuations for major programs.
 * There is no live API for this. Numbers are a hand-maintained snapshot of
 * typical published valuations (The Points Guy / similar public charts, 2026)
 * and should be updated periodically. Always shown as "approx." — never used
 * to auto-redeem.
 */

import type { FlightOption, HotelOption, LoyaltyKind, LoyaltyMembership } from "@/types";

export const LOYALTY_PROGRAMS = [
  { id: "delta_skymiles", label: "Delta SkyMiles", kind: "airline" as const, match: ["delta", "dl"] },
  { id: "united_mileageplus", label: "United MileagePlus", kind: "airline" as const, match: ["united", "ua"] },
  { id: "american_aadvantage", label: "American AAdvantage", kind: "airline" as const, match: ["american", "aa"] },
  { id: "southwest_rapid", label: "Southwest Rapid Rewards", kind: "airline" as const, match: ["southwest", "wn"] },
  { id: "alaska_mileage", label: "Alaska Mileage Plan", kind: "airline" as const, match: ["alaska", "as"] },
  { id: "jetblue_trueblue", label: "JetBlue TrueBlue", kind: "airline" as const, match: ["jetblue", "b6"] },
  { id: "aircanada_aeroplan", label: "Air Canada Aeroplan", kind: "airline" as const, match: ["air canada", "ac"] },
  { id: "ba_executive", label: "British Airways Executive Club", kind: "airline" as const, match: ["british airways", "ba"] },
  { id: "lufthansa_miles", label: "Lufthansa Miles & More", kind: "airline" as const, match: ["lufthansa", "lh"] },
  { id: "airfrance_flyingblue", label: "Air France/KLM Flying Blue", kind: "airline" as const, match: ["air france", "klm", "af", "kl"] },
  { id: "emirates_skyswards", label: "Emirates Skywards", kind: "airline" as const, match: ["emirates", "ek"] },
  { id: "qatar_privilege", label: "Qatar Privilege Club", kind: "airline" as const, match: ["qatar", "qr"] },
  { id: "singapore_krisflyer", label: "Singapore KrisFlyer", kind: "airline" as const, match: ["singapore", "sq"] },
  { id: "ana_mileage", label: "ANA Mileage Club", kind: "airline" as const, match: ["ana", "nh"] },
  { id: "jal_mileage", label: "JAL Mileage Bank", kind: "airline" as const, match: ["japan airlines", "jal", "jl"] },
  { id: "qantas_frequent", label: "Qantas Frequent Flyer", kind: "airline" as const, match: ["qantas", "qf"] },
  { id: "turkish_miles", label: "Turkish Miles&Smiles", kind: "airline" as const, match: ["turkish", "tk"] },
  { id: "swiss_miles", label: "SWISS Miles & More", kind: "airline" as const, match: ["swiss", "lx"] },
  { id: "airnz_airpoints", label: "Air New Zealand Airpoints", kind: "airline" as const, match: ["air new zealand", "nz"] },
  { id: "ethiopian_shemba", label: "Ethiopian ShebaMiles", kind: "airline" as const, match: ["ethiopian", "et"] },
  { id: "avianca_lifemiles", label: "Avianca LifeMiles", kind: "airline" as const, match: ["avianca", "av"] },
  { id: "westjet_rewards", label: "WestJet Rewards", kind: "airline" as const, match: ["westjet", "ws"] },
  { id: "marriott_bonvoy", label: "Marriott Bonvoy", kind: "hotel" as const, match: ["marriott", "westin", "sheraton", "w hotel", "st. regis", "ritz"] },
  { id: "hilton_honors", label: "Hilton Honors", kind: "hotel" as const, match: ["hilton", "doubletree", "hampton", "waldorf"] },
  { id: "hyatt", label: "World of Hyatt", kind: "hotel" as const, match: ["hyatt"] },
  { id: "ihg", label: "IHG One Rewards", kind: "hotel" as const, match: ["holiday inn", "intercontinental", "crowne plaza", "kimpton", "ihg"] },
  { id: "wyndham", label: "Wyndham Rewards", kind: "hotel" as const, match: ["wyndham"] },
  { id: "choice", label: "Choice Privileges", kind: "hotel" as const, match: ["choice", "comfort inn", "quality inn"] },
  { id: "other", label: "Other", kind: "other" as const, match: [] },
] as const;

/** Typical cents per point/mile. Edit this table when public valuations move. */
export const CENTS_PER_POINT: Record<string, number> = {
  delta_skymiles: 1.2,
  united_mileageplus: 1.3,
  american_aadvantage: 1.4,
  southwest_rapid: 1.3,
  alaska_mileage: 1.5,
  jetblue_trueblue: 1.2,
  aircanada_aeroplan: 1.5,
  ba_executive: 1.4,
  lufthansa_miles: 1.2,
  airfrance_flyingblue: 1.2,
  emirates_skyswards: 1.4,
  qatar_privilege: 1.6,
  singapore_krisflyer: 1.3,
  ana_mileage: 1.4,
  jal_mileage: 1.3,
  qantas_frequent: 1.5,
  turkish_miles: 1.2,
  swiss_miles: 1.2,
  airnz_airpoints: 1.5,
  ethiopian_shemba: 1.1,
  avianca_lifemiles: 1.2,
  westjet_rewards: 1.2,
  marriott_bonvoy: 0.85,
  hilton_honors: 0.5,
  hyatt: 1.7,
  ihg: 0.5,
  wyndham: 1.1,
  choice: 0.6,
  other: 1.0,
};

export function programById(id: string) {
  return LOYALTY_PROGRAMS.find((p) => p.id === id) ?? LOYALTY_PROGRAMS[LOYALTY_PROGRAMS.length - 1];
}

export function centsPerPoint(programId: string) {
  return CENTS_PER_POINT[programId] ?? CENTS_PER_POINT.other;
}

export function pointsValueUsd(balance: number, programId: string) {
  return Math.round((balance * centsPerPoint(programId)) / 100);
}

export function pointsForCash(cashUsd: number, programId: string) {
  const cpp = centsPerPoint(programId);
  if (cpp <= 0) return cashUsd;
  return Math.round((cashUsd * 100) / cpp);
}

export interface PointsComparison {
  membership: LoyaltyMembership;
  cashUsd: number;
  pointsNeeded: number;
  pointsWorthUsd: number;
  differenceUsd: number;
  enough: boolean;
  cashIsBetter: boolean;
}

function haystack(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function relevantMemberships(
  wallets: LoyaltyMembership[],
  kind: LoyaltyKind,
  text: string
): LoyaltyMembership[] {
  const hay = text.toLowerCase();
  return wallets.filter((w) => {
    const program = programById(w.programId);
    if (program.kind !== kind && w.kind !== kind) return false;
    if (program.id === "other") return false;
    return program.match.some((token) => hay.includes(token));
  });
}

export function compareFlightPoints(flight: FlightOption, wallets: LoyaltyMembership[]): PointsComparison[] {
  const text = haystack([flight.airline, flight.airlineCode]);
  return relevantMemberships(wallets, "airline", text).map((membership) =>
    buildComparison(flight.totalPrice, membership)
  );
}

export function compareHotelPoints(hotel: HotelOption, wallets: LoyaltyMembership[]): PointsComparison[] {
  const text = haystack([hotel.name, hotel.neighborhood, hotel.city]);
  const matched = relevantMemberships(wallets, "hotel", text);
  if (matched.length) return matched.map((m) => buildComparison(hotel.totalPrice, m));
  return wallets
    .filter((w) => w.kind === "hotel" && w.programId !== "other")
    .slice(0, 1)
    .map((m) => buildComparison(hotel.totalPrice, m));
}

function buildComparison(cashUsd: number, membership: LoyaltyMembership): PointsComparison {
  const pointsNeeded = pointsForCash(cashUsd, membership.programId);
  const pointsWorthUsd = pointsValueUsd(Math.min(membership.balance, pointsNeeded), membership.programId);
  const enough = membership.balance >= pointsNeeded;
  const differenceUsd = cashUsd - pointsValueUsd(pointsNeeded, membership.programId);
  return {
    membership,
    cashUsd,
    pointsNeeded,
    pointsWorthUsd,
    differenceUsd,
    enough,
    cashIsBetter: differenceUsd > 0,
  };
}

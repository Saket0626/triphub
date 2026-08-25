/** Rank live activities by best overall deal: high ratings, real extras, cheap as a high priority. */

import type { ActivityOption, Trip } from "@/types";

export const ACTIVITY_PAGE_SIZE = 12;

function durationHours(activity: ActivityOption) {
  if (activity.durationMinutes && activity.durationMinutes > 0) {
    return Math.max(activity.durationMinutes / 60, 0.5);
  }
  const hours = activity.duration.match(/(\d+(?:\.\d+)?)\s*hour/i);
  if (hours) return Math.max(Number(hours[1]), 0.5);
  const minutes = activity.duration.match(/(\d+)\s*min/i);
  if (minutes) return Math.max(Number(minutes[1]) / 60, 0.5);
  return 2;
}

function typicalPrice(activities: ActivityOption[]) {
  const prices = activities.map((a) => a.pricePerPerson).filter((n) => n > 0).sort((a, b) => a - b);
  if (!prices.length) return 100;
  return prices[Math.floor(prices.length / 2)] || 100;
}

export function activityValueScore(activity: ActivityOption, typical = 100) {
  const price = Math.max(activity.pricePerPerson, 1);
  const rating = activity.rating ?? 3.8;
  const reviewCount = activity.reviewCount ?? 8;
  const reviews = Math.pow(Math.log10(reviewCount + 10), 1.45);
  const reviewTrust = reviewCount < 20 ? 0.35 : reviewCount < 50 ? 0.55 : reviewCount < 150 ? 0.8 : 1;
  const extras =
    1 +
    0.07 * Math.min(activity.inclusions?.length ?? 0, 8) +
    (activity.freeCancellation ? 0.15 : 0);
  const deal =
    activity.listPrice && activity.listPrice > price
      ? 1 + Math.min((activity.listPrice - price) / activity.listPrice, 0.25)
      : 1;
  const hours = Math.min(durationHours(activity), 8);
  const timeWorth = Math.pow(Math.max(hours, 0.75), 0.35);
  const quality = Math.pow(rating, 3.4) * reviews * reviewTrust;
  const relativePrice = price / Math.max(typical, 1);
  return (quality * extras * deal * timeWorth) / Math.pow(relativePrice, 0.75);
}

export function activityValueReason(activity: ActivityOption) {
  const bits: string[] = [];
  if (activity.rating) bits.push(`${activity.rating.toFixed(1)}★`);
  if (activity.reviewCount) bits.push(`${activity.reviewCount.toLocaleString()} reviews`);
  bits.push(`$${Math.round(activity.pricePerPerson)}`);
  if (activity.freeCancellation) bits.push("free cancel");
  return bits.join(" · ");
}

const QUERY_ALIASES: Record<string, string[]> = {
  scuba: ["scuba", "dive", "diving", "padi"],
  diving: ["diving", "dive", "scuba"],
  dive: ["dive", "diving", "scuba"],
  snorkel: ["snorkel", "snorkeling"],
  snorkeling: ["snorkeling", "snorkel"],
  restaurant: ["restaurant", "dining", "dinner", "luau", "food", "culinary"],
  restaurants: ["restaurant", "dining", "dinner", "luau", "food", "culinary"],
  food: ["food", "culinary", "foodie", "gastro", "dining", "restaurant", "luau"],
  dining: ["dining", "dinner", "restaurant", "luau", "food", "culinary"],
  luau: ["luau", "feast"],
  tour: ["tour", "walk", "walking", "guided", "crawl"],
  sunset: ["sunset", "golden hour", "sail", "cruise"],
  cruise: ["cruise", "sail", "boat", "catamaran"],
  museum: ["museum", "gallery", "culture", "skip-the-line"],
  spa: ["spa", "massage", "wellness"],
  hike: ["hike", "hiking", "trail", "waterfall"],
  hiking: ["hike", "hiking", "trail", "waterfall"],
  beach: ["beach", "coast", "shore"],
  nightlife: ["nightlife", "bar", "club", "pub crawl"],
  wine: ["wine", "vineyard", "tasting"],
  tasting: ["tasting", "wine", "food"],
  helicopter: ["helicopter", "scenic flight"],
  kayak: ["kayak", "kayaking", "canoe", "paddle"],
  wildlife: ["wildlife", "safari", "whale", "turtle"],
  photography: ["photo", "photography", "photoshoot"],
  walking: ["walking", "walk", "walking tour"],
  cooking: ["cooking", "cook", "class"],
  bike: ["bike", "biking", "cycling"],
  balloon: ["balloon", "hot air"],
  safari: ["safari", "wildlife", "game drive"],
  temple: ["temple", "shrine", "pagoda"],
  castle: ["castle", "palace", "fort"],
  island: ["island", "islands"],
  theme: ["theme park", "amusement"],
  park: ["park", "theme park"],
};

const STRONG_TOKENS = new Set(["scuba", "diving", "dive", "snorkel", "snorkeling"]);
const GENERIC_TOKENS = new Set(["tour", "tours", "trip", "experience", "activity"]);

function normalizeToken(token: string) {
  if (QUERY_ALIASES[token]) return token;
  if (token.endsWith("s") && QUERY_ALIASES[token.slice(0, -1)]) return token.slice(0, -1);
  return token;
}

function fieldHits(field: string, token: string) {
  const aliases = QUERY_ALIASES[token] ?? [token];
  return aliases.some((alias) => field.includes(alias));
}

function queryRelevance(activity: ActivityOption, query?: string) {
  const raw = query?.trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!raw) return 1;
  const name = activity.name.toLowerCase();
  if (name.includes(raw)) return 1.7;
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2).map(normalizeToken);
  if (!tokens.length) return 1;
  const distinctive = tokens.filter((token) => !GENERIC_TOKENS.has(token));
  const needed = distinctive.length ? distinctive : tokens;
  const hits = needed.filter((token) => fieldHits(name, token)).length;
  if (hits === needed.length) return 1.35;
  if (hits > 0) return 1.12;
  return 1;
}

const DEST_TOUR_SLUGS: Record<string, string[]> = {
  HNL: ["honolulu", "oahu", "waikiki"],
  OGG: ["maui", "kahului", "lahaina", "kihei"],
  KOA: ["big-island", "kona", "hilo", "hawaii-island"],
  LAX: ["los-angeles", "hollywood", "santa-monica", "anaheim", "long-beach", "burbank"],
  SAN: ["san-diego", "la-jolla"],
  SFO: ["san-francisco", "napa", "napa-valley", "sausalito", "oakland"],
  SEA: ["seattle"],
  LAS: ["las-vegas", "vegas"],
  JFK: ["new-york-city", "new-york", "manhattan", "brooklyn"],
  EWR: ["new-york-city", "new-york", "manhattan", "brooklyn"],
  LGA: ["new-york-city", "new-york", "manhattan", "brooklyn"],
  MIA: ["miami", "miami-beach", "south-beach"],
  FLL: ["fort-lauderdale", "miami", "miami-beach"],
  MCO: ["orlando", "kissimmee", "universal-orlando"],
  CUN: ["cancun", "isla-mujeres", "playa-del-carmen", "tulum", "cozumel", "riviera-maya"],
  SJU: ["san-juan", "puerto-rico"],
  BOS: ["boston", "cambridge"],
  ORD: ["chicago"],
  MDW: ["chicago"],
  DFW: ["dallas", "fort-worth"],
  ATL: ["atlanta"],
  DEN: ["denver", "boulder"],
  PHX: ["phoenix", "scottsdale"],
  AUS: ["austin"],
  PDX: ["portland"],
  IAD: ["washington-dc", "washington", "arlington"],
  DCA: ["washington-dc", "washington", "arlington"],
  CLT: ["charlotte"],
  DTW: ["detroit"],
  MSP: ["minneapolis"],
  LHR: ["london", "westminster", "soho"],
  LGW: ["london"],
  STN: ["london"],
  CDG: ["paris", "montmartre", "louvre"],
  ORY: ["paris"],
  AMS: ["amsterdam"],
  FRA: ["frankfurt"],
  MUC: ["munich"],
  FCO: ["rome", "vatican"],
  MXP: ["milan"],
  BCN: ["barcelona"],
  MAD: ["madrid"],
  DUB: ["dublin"],
  LIS: ["lisbon"],
  ATH: ["athens"],
  IST: ["istanbul"],
  ZRH: ["zurich"],
  VIE: ["vienna"],
  PRG: ["prague"],
  BUD: ["budapest"],
  CPH: ["copenhagen"],
  ARN: ["stockholm"],
  HEL: ["helsinki"],
  NRT: ["tokyo", "shibuya", "asakusa"],
  HND: ["tokyo", "shibuya"],
  KIX: ["osaka", "kyoto"],
  ICN: ["seoul"],
  HKG: ["hong-kong", "hong kong"],
  TPE: ["taipei"],
  SIN: ["singapore"],
  BKK: ["bangkok"],
  HKT: ["phuket"],
  DPS: ["bali", "ubud", "seminyak"],
  KUL: ["kuala-lumpur"],
  MNL: ["manila"],
  SGN: ["ho-chi-minh-city", "saigon"],
  HAN: ["hanoi"],
  DEL: ["delhi", "new-delhi"],
  BOM: ["mumbai"],
  SYD: ["sydney"],
  MEL: ["melbourne"],
  AKL: ["auckland"],
  DXB: ["dubai"],
  AUH: ["abu-dhabi"],
  DOH: ["doha"],
  TLV: ["tel-aviv", "jerusalem"],
  CAI: ["cairo"],
  JNB: ["johannesburg"],
  CPT: ["cape-town"],
  YYZ: ["toronto"],
  YVR: ["vancouver"],
  YUL: ["montreal"],
  MEX: ["mexico-city"],
  GDL: ["guadalajara"],
  GRU: ["sao-paulo"],
  GIG: ["rio-de-janeiro", "rio"],
  EZE: ["buenos-aires"],
  SCL: ["santiago"],
  LIM: ["lima"],
  BOG: ["bogota"],
  PTY: ["panama-city"],
  CTG: ["cartagena"],
  CUZ: ["cusco", "machu-picchu"],
  NCE: ["nice", "cannes", "monaco"],
  VCE: ["venice"],
  NAP: ["naples", "amalfi", "capri", "pompeii"],
  EDI: ["edinburgh"],
  GLA: ["glasgow"],
  MAN: ["manchester"],
  BER: ["berlin"],
  DUS: ["dusseldorf"],
  HAM: ["hamburg"],
  OSL: ["oslo"],
  KEF: ["reykjavik", "iceland"],
  SAW: ["istanbul"],
  RUH: ["riyadh"],
  JED: ["jeddah"],
  NBO: ["nairobi"],
  ADD: ["addis-ababa"],
  CMN: ["casablanca"],
  RAK: ["marrakech"],
  PEK: ["beijing"],
  PVG: ["shanghai"],
  CAN: ["guangzhou"],
  FUK: ["fukuoka"],
  CTS: ["sapporo"],
  MLE: ["maldives", "male"],
  NAN: ["fiji", "nadi"],
  PPT: ["tahiti", "papeete", "bora-bora"],
  ZQN: ["queenstown"],
  BNE: ["brisbane"],
  PER: ["perth"],
};

const SLUG_OWNERS = (() => {
  const map = new Map<string, string[]>();
  for (const [code, slugs] of Object.entries(DEST_TOUR_SLUGS)) {
    for (const slug of slugs) {
      const list = map.get(slug) ?? [];
      list.push(code);
      map.set(slug, list);
    }
  }
  return map;
})();

function tourSlug(url?: string) {
  if (!url) return "";
  const match = url.match(/\/tours\/([^/]+)/i);
  return decodeURIComponent(match?.[1] ?? "").toLowerCase();
}

export function isLowValueFiller(activity: ActivityOption) {
  const name = activity.name.toLowerCase();
  return /luggage storage|bag storage|bike rental|e-bike rental|ebike rental|scooter rental|sim card|portable wifi|airport transfer|hotel to airport|airport to hotel|private transfer/.test(
    name
  );
}

export function activityFitsDestination(activity: ActivityOption, trip: Pick<Trip, "destinationCode" | "destinationLabel">) {
  const slug = tourSlug(activity.productUrl);
  if (slug) {
    const owners = SLUG_OWNERS.get(slug);
    if (owners) return owners.includes(trip.destinationCode);
  }
  const blob = `${activity.name} ${activity.description}`.toLowerCase();
  const ours = (DEST_TOUR_SLUGS[trip.destinationCode] ?? []).map((s) => s.replace(/-/g, " "));
  for (const [code, slugs] of Object.entries(DEST_TOUR_SLUGS)) {
    if (code === trip.destinationCode) continue;
    const foreign = slugs.map((s) => s.replace(/-/g, " ")).filter((s) => s.length > 5);
    if (foreign.some((name) => blob.includes(name)) && !ours.some((name) => blob.includes(name))) {
      return false;
    }
  }
  return true;
}

export function rankActivities(activities: ActivityOption[], query?: string): ActivityOption[] {
  const typical = typicalPrice(activities);
  return [...activities]
    .map((activity) => ({
      ...activity,
      valueScore: activityValueScore(activity, typical) * queryRelevance(activity, query) * (isLowValueFiller(activity) ? 0.12 : 1),
      valueReason: activityValueReason(activity),
    }))
    .sort((a, b) => {
      const diff = (b.valueScore ?? 0) - (a.valueScore ?? 0);
      if (Math.abs(diff) > 0.0001) return diff;
      if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
      return a.pricePerPerson - b.pricePerPerson;
    });
}

export function paginateActivities(activities: ActivityOption[], page: number, pageSize = ACTIVITY_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const prices = activities.map((a) => a.pricePerPerson).filter((n) => n > 0);
  return {
    page: safePage,
    pageSize,
    total: activities.length,
    totalPages: Math.max(1, Math.ceil(activities.length / pageSize)),
    items: activities.slice(start, start + pageSize),
    highestPrice: prices.length ? Math.max(...prices) : 0,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
  };
}

export function activityMatchesQuery(activity: ActivityOption, query?: string) {
  const raw = query?.trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!raw) return true;
  const name = activity.name.toLowerCase();
  const nameCat = `${name} ${activity.category}`.toLowerCase();
  if (name.includes(raw) || nameCat.includes(raw)) return true;
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2).map(normalizeToken);
  if (!tokens.length) return true;
  if (tokens.includes("scuba")) {
    return nameCat.includes("scuba") || nameCat.includes("padi");
  }
  const strong = tokens.filter((token) => STRONG_TOKENS.has(token));
  if (strong.length) {
    return strong.every((token) => fieldHits(nameCat, token));
  }
  const distinctive = tokens.filter((token) => !GENERIC_TOKENS.has(token));
  const generic = tokens.filter((token) => GENERIC_TOKENS.has(token));
  if (distinctive.length && generic.length) {
    return distinctive.every((token) => fieldHits(name, token)) && generic.every((token) => fieldHits(name, token));
  }
  const needed = distinctive.length ? distinctive : tokens;
  return needed.every((token) => fieldHits(nameCat, token));
}

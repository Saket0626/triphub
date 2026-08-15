/**
 * Layer B — Anthropic Claude with web search, cached 24h.
 * Model: claude-sonnet-4-6
 * Tool: web_search (server-side)
 * Docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
 */

import { env, isPlaceholder } from "@/lib/env";
import { mockDestinationResearch } from "@/lib/mock-research";
import { generateId } from "@/lib/utils";
import type { DestinationResearch, ResearchFinding, Trip } from "@/types";

export function isAnthropicConfigured() {
  const key = env.anthropicApiKey;
  return Boolean(key) && key.startsWith("sk-ant-") && !isPlaceholder(key);
}

export function isLiveResearch() {
  return !env.sandboxMode && isAnthropicConfigured();
}

export function researchCacheKey(trip: Trip) {
  return [
    trip.destinationCode,
    trip.departureDate,
    trip.returnDate ?? "",
    trip.tripPurpose ?? "",
    env.sandboxMode ? "sandbox" : "live",
  ].join("|");
}

function cityName(label: string) {
  return label.split("(")[0].trim();
}

function parseFindings(raw: unknown, kind: ResearchFinding["kind"]): ResearchFinding[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const sourceUrl = String(row.sourceUrl ?? "");
      if (!sourceUrl.startsWith("http")) return null;
      return {
        id: generateId(),
        kind: (row.kind as ResearchFinding["kind"]) || kind,
        title: String(row.title ?? "").slice(0, 140),
        summary: String(row.summary ?? "").slice(0, 480),
        sourceUrl,
        sourceName: String(row.sourceName ?? "Source").slice(0, 80),
        relatedNames: Array.isArray(row.relatedNames)
          ? row.relatedNames.map((n) => String(n)).slice(0, 6)
          : [],
      } satisfies ResearchFinding;
    })
    .filter((x): x is ResearchFinding => Boolean(x && x.title && x.summary));
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type AnthropicBlock = {
  type?: string;
  text?: string;
  citations?: Array<{ url?: string; title?: string }>;
};

export async function runDestinationResearch(trip: Trip): Promise<DestinationResearch> {
  if (!isLiveResearch()) {
    return mockDestinationResearch(trip);
  }

  const city = cityName(trip.destinationLabel);
  const dates = `${trip.departureDate} to ${trip.returnDate ?? trip.departureDate}`;
  const purpose = trip.tripPurpose ?? "vacation";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
        },
      ],
      system:
        "You research a specific trip. Use web search. Every specific claim (a date, a price, a 'currently running' deal) MUST include a sourceUrl the traveler can open. Return ONLY JSON with keys deals, events, localFavorites. Each item: title, summary, sourceUrl, sourceName, relatedNames (hotel or tour names if any), kind (hotel|activity|general). No markdown.",
      messages: [
        {
          role: "user",
          content: `Research ${city} (${trip.destinationCode}) for a ${purpose} trip ${dates}, party of ${trip.adultCount + trip.childCount}. Find: (1) currently-running hotel or activity deals/promos, (2) seasonal events during those exact dates, (3) 2–3 local-favorite hotels or experiences a ranked API might bury. If you cannot verify something with a URL, omit it.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return mockDestinationResearch(trip);
  }

  const json = (await res.json()) as { content?: AnthropicBlock[] };
  const text = (json.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJsonObject(text);
  const fetchedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (!parsed) {
    return mockDestinationResearch(trip);
  }

  return {
    source: "anthropic",
    fetchedAt,
    expiresAt,
    deals: parseFindings(parsed.deals, "hotel"),
    events: parseFindings(parsed.events, "general"),
    localFavorites: parseFindings(parsed.localFavorites, "activity"),
  };
}

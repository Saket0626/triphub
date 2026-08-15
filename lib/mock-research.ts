/** Realistic Claude-shaped destination research used while ANTHROPIC_API_KEY is missing or SANDBOX_MODE is on. */

import type { DestinationResearch, ResearchFinding, Trip } from "@/types";
import { generateId } from "@/lib/utils";

function cityName(label: string) {
  return label.split("(")[0].trim();
}

function finding(
  kind: ResearchFinding["kind"],
  title: string,
  summary: string,
  sourceName: string,
  sourceUrl: string,
  relatedNames: string[]
): ResearchFinding {
  return { id: generateId(), kind, title, summary, sourceName, sourceUrl, relatedNames };
}

export function mockDestinationResearch(trip: Trip): DestinationResearch {
  const city = cityName(trip.destinationLabel);
  const fetchedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    source: "mock",
    fetchedAt,
    expiresAt,
    deals: [
      finding(
        "hotel",
        `Rooftop bar deal at The ${city} Atelier`,
        `Local write-ups say the Atelier rooftop is running a prix-fixe sunset menu through the end of the month. Worth asking the desk when you check in — this is informational, not a booked add-on.`,
        "Time Out",
        "https://www.timeout.com/",
        [`The ${city} Atelier`, "Atelier"]
      ),
      finding(
        "activity",
        "Sunset cruise is discounted midweek",
        `Several tour pages are showing a weekday rate on harbor cruises in ${city} during your dates. Confirm on the operator page before you treat the price as locked.`,
        "Viator",
        "https://www.viator.com/",
        ["Sunset cruise", "cruise"]
      ),
    ],
    events: [
      finding(
        "general",
        `What's on in ${city} during your dates`,
        `Neighborhood festival listings and museum late nights often cluster on weekends. Check the city visitor bureau calendar for ${trip.departureDate}–${trip.returnDate ?? trip.departureDate} before you lock evening plans.`,
        `${city} visitor bureau`,
        "https://www.google.com/search?q=" + encodeURIComponent(`${city} events ${trip.departureDate}`),
        []
      ),
    ],
    localFavorites: [
      finding(
        "hotel",
        `${city} Harbor House is a regular local pick`,
        `Travel forums keep pointing people at Harbor House for the waterfront walk — less flashy than the 5-stars, easier to get a table downstairs.`,
        "Tripadvisor forums",
        "https://www.tripadvisor.com/",
        [`${city} Harbor House`, "Harbor House"]
      ),
      finding(
        "activity",
        "Food market tasting beats the big-bus loop",
        `Locals keep recommending a market walk over the hop-on hop-off for a first food day in ${city}.`,
        "Eater",
        "https://www.eater.com/",
        ["food market", "tasting"]
      ),
      finding(
        "general",
        "Skip the main square at 2pm",
        `Recent visitor write-ups say the central square is packed mid-afternoon. Early morning or after 6 is the move.`,
        "Lonely Planet",
        "https://www.lonelyplanet.com/",
        []
      ),
    ],
  };
}

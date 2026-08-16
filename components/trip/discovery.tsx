import type { ResearchFinding } from "@/types";
import { Badge } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";

export function LiveInsightBadge({ finding }: { finding: ResearchFinding }) {
  return (
    <div className="rounded-xl border border-channel/20 bg-accent px-3 py-2 text-sm">
      <Badge variant="recommend">Live insight</Badge>
      <p className="mt-1.5 text-soundings">{finding.summary}</p>
      <a
        href={finding.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-xs font-medium text-channel hover:underline"
      >
        According to {finding.sourceName}
      </a>
    </div>
  );
}

export function WorthKnowingPanel({ findings }: { findings: ResearchFinding[] }) {
  if (!findings.length) return null;
  return (
    <Card className="mt-8">
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-channel">
            Worth knowing about your trip
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Research notes — not bookable from here. Open the source if you want to double-check.
          </p>
        </div>
        {findings.map((finding) => (
          <div key={finding.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
            <p className="font-medium">{finding.title}</p>
            <p className="mt-1 text-sm text-pencil">{finding.summary}</p>
            <a
              href={finding.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-medium text-channel hover:underline"
            >
              According to {finding.sourceName}
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SandboxNote({ inventory, research }: { inventory: string; research: string }) {
  return (
    <p className="mb-6 text-xs text-muted-foreground">
      Sample {inventory} + {research} research while sandbox is on. Nothing here is a live hold.
    </p>
  );
}

export function PlaceMeta({
  rating,
  ratingCount,
  hoursSummary,
  businessStatus,
  source,
}: {
  rating?: number;
  ratingCount?: number;
  hoursSummary?: string;
  businessStatus?: string;
  source?: "mock" | "geoapify";
}) {
  if (!rating && !hoursSummary) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {rating ? `${rating.toFixed(1)} rating` : null}
      {rating && ratingCount ? ` (${ratingCount})` : null}
      {hoursSummary ? ` · ${hoursSummary}` : null}
      {businessStatus && businessStatus !== "OPERATIONAL" ? ` · ${businessStatus}` : null}
      {source === "geoapify" ? " · Geoapify" : null}
    </p>
  );
}

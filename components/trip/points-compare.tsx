import { formatCurrency } from "@/lib/utils";
import type { PointsComparison } from "@/lib/loyalty";

export function PointsCompare({ comparisons }: { comparisons: PointsComparison[] }) {
  if (!comparisons.length) return null;
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-secondary/60 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-channel">Cash vs points</p>
      {comparisons.map((row) => {
        const save = Math.abs(row.differenceUsd);
        const verb = row.cashIsBetter ? "Cash looks better by" : "Points look better by";
        return (
          <div key={row.membership.id} className="text-sm">
            <p className="font-medium">{row.membership.programLabel}</p>
            <p className="mt-1 text-pencil">
              Pay cash: {formatCurrency(row.cashUsd)}
            </p>
            <p className="text-pencil">
              Use {row.pointsNeeded.toLocaleString()} points (worth about{" "}
              {formatCurrency(row.pointsWorthUsd)} at this program&apos;s typical value).
              {row.enough
                ? ` You have ${row.membership.balance.toLocaleString()} on file.`
                : ` You entered ${row.membership.balance.toLocaleString()} — not enough for this one.`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {verb} {formatCurrency(save)}. Approximate, and we never spend your points for you.
            </p>
          </div>
        );
      })}
    </div>
  );
}

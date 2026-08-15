import { cn } from "@/lib/utils";

/** Labeled frame for a shot to license or photograph — not a stand-in stock image. */
export function PhotoSlot({
  brief,
  className,
  tone = "dusk",
}: {
  brief: string;
  className?: string;
  tone?: "dusk" | "paper";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        tone === "dusk" ? "bg-[#1B2430]" : "bg-secondary",
        className
      )}
      role="img"
      aria-label={brief}
    >
      <span
        className={cn(
          "pointer-events-none absolute bottom-4 left-4 right-4 max-w-md text-[10px] font-medium uppercase leading-relaxed tracking-[0.16em]",
          tone === "dusk" ? "text-white/45" : "text-pencil"
        )}
      >
        Placeholder — {brief}
      </span>
    </div>
  );
}

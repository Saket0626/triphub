import { cn } from "@/lib/utils";

type WindowSize = "sm" | "md" | "hero";

const sizes: Record<WindowSize, string> = {
  sm: "h-10 w-8",
  md: "h-16 w-12",
  hero: "h-[min(420px,70vw)] w-[min(280px,58vw)] sm:h-[440px] sm:w-[300px]",
};

/**
 * Signature cabin window — aircraft-window proportion, empty weather beyond the glass.
 * Lit = chart inner ring. Dark = upcoming / unused.
 */
export function CabinWindow({
  size = "md",
  lit = true,
  label,
  className,
}: {
  size?: WindowSize;
  lit?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 bg-soundings p-[3px] shadow-none",
        size === "hero" ? "rounded-[2.35rem]" : size === "md" ? "rounded-[1.05rem]" : "rounded-[0.7rem]",
        sizes[size],
        className
      )}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden",
          size === "hero" ? "rounded-[2.05rem]" : size === "md" ? "rounded-[0.88rem]" : "rounded-[0.52rem]",
          lit ? "ring-1 ring-inset ring-chart" : "ring-1 ring-inset ring-pencil/40"
        )}
        style={{
          background: lit
            ? "linear-gradient(165deg, hsl(var(--overwing)) 0%, hsl(var(--channel) / 0.55) 52%, hsl(var(--soundings) / 0.88) 100%)"
            : "linear-gradient(180deg, hsl(var(--overwing)) 0%, hsl(var(--pencil) / 0.35) 100%)",
        }}
      />
    </div>
  );
}

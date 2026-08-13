import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-block h-8 w-8 shrink-0", className)}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-[9px] bg-channel" />
      <span className="absolute left-[6px] top-[5px] h-[14px] w-[18px] rounded-[4px] bg-white/95" />
      <span className="absolute bottom-[5px] right-[5px] h-[14px] w-[18px] rounded-[4px] bg-white/35" />
    </span>
  );
}

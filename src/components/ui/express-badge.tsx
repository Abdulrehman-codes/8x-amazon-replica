import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Our equivalent of the Prime flash: fast, free, members-only delivery. */
export function ExpressBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold text-link",
        className,
      )}
    >
      <Zap size={12} fill="currentColor" strokeWidth={0} />
      express
    </span>
  );
}

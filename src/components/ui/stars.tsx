import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Five stars with a fractional fill. Two stacked rows clipped by width beat
 * per-star half-icons: 4.3 reads as 4.3, not as "four and a bit".
 */
export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="flex gap-px text-border-strong">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} strokeWidth={1.5} fill="currentColor" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-px overflow-hidden text-star"
        style={{ width: `${pct}%` }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            fill="currentColor"
            className="shrink-0"
          />
        ))}
      </span>
    </span>
  );
}

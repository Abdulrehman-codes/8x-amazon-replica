import { cn } from "@/lib/utils";

/** Lucide's `star`, defined once per document and referenced by `<use>`. */
const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

export const STAR_SPRITE_ID = "bz-star";

/**
 * Rendered once in the layout. Every rating on the page then points at this
 * symbol instead of carrying its own copy of the path.
 *
 * This matters more than it sounds: a rating draws ten stars (a grey row and
 * a clipped coloured row), and a listing page shows dozens of ratings. Inlined
 * per icon, that was 262KB of duplicated SVG on the home page alone — roughly
 * half the document.
 */
export function StarSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <symbol id={STAR_SPRITE_ID} viewBox="0 0 24 24">
        <path
          d={STAR_PATH}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </symbol>
    </svg>
  );
}

function Row({ size }: { size: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} className="shrink-0">
          <use href={`#${STAR_SPRITE_ID}`} width={size} height={size} />
        </svg>
      ))}
    </>
  );
}

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
        <Row size={size} />
      </span>
      <span
        className="absolute inset-0 flex gap-px overflow-hidden text-star"
        style={{ width: `${pct}%` }}
      >
        <Row size={size} />
      </span>
    </span>
  );
}

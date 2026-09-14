import { cn } from "@/lib/utils";

/**
 * Amazon renders the cents as a raised superscript, which keeps a column of
 * prices optically aligned on the dollar figure. Worth copying.
 */
export function Price({
  cents,
  size = "md",
  className,
}: {
  cents: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dollars = Math.floor(cents / 100).toLocaleString("en-US");
  const remainder = String(cents % 100).padStart(2, "0");

  const scale = {
    sm: { main: "text-base", sup: "text-[10px]" },
    md: { main: "text-xl", sup: "text-xs" },
    lg: { main: "text-3xl", sup: "text-sm" },
  }[size];

  return (
    <span className={cn("inline-flex items-start font-medium", className)}>
      <span className={cn(scale.sup, "mt-[0.25em]")}>$</span>
      <span className={cn(scale.main, "leading-none tracking-tight")}>
        {dollars}
      </span>
      <span className={cn(scale.sup, "mt-[0.25em]")}>{remainder}</span>
    </span>
  );
}

export function ListPrice({
  listCents,
  priceCents,
  className,
}: {
  listCents: number;
  priceCents: number;
  className?: string;
}) {
  if (listCents <= priceCents) return null;
  const off = Math.round((1 - priceCents / listCents) * 100);

  return (
    <span className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="rounded bg-price px-1.5 py-0.5 font-semibold text-white">
        -{off}%
      </span>
      <span className="text-fg-subtle">
        List:{" "}
        <span className="line-through">
          ${(listCents / 100).toFixed(2)}
        </span>
      </span>
    </span>
  );
}

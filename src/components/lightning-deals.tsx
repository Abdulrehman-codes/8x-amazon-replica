import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Price } from "@/components/ui/price";
import { DealCountdown } from "@/components/deal-countdown";
import { claimedPercent, dealEndsAt, discountPercent, savingsCents } from "@/lib/deals";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * The deals strip. Discounts are real — the gap between list price and price —
 * while the urgency around them is derived per product per day, so everyone
 * sees the same countdown without anything needing to schedule it.
 */
export function LightningDeals({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="overflow-hidden rounded-card bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[linear-gradient(100deg,#1b2836,#2f4a63)] px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-ink">
            <Zap size={15} fill="currentColor" strokeWidth={0} />
          </span>
          Lightning deals
        </h2>
        <Link
          href="/s?deals=1&sort=featured"
          className="text-sm font-semibold text-accent hover:underline"
        >
          See all deals →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto p-4 no-scrollbar">
        {products.map((product) => {
          const off = discountPercent(product);
          const claimed = claimedPercent(product);
          const endsAt = dealEndsAt(product).getTime();

          return (
            <Link
              key={product.id}
              href={`/dp/${product.slug}`}
              className="group w-[11.5rem] shrink-0 rounded-card border border-border p-3 transition hover:border-accent hover:shadow-md"
            >
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-canvas">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  sizes="184px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-price px-1.5 py-0.5 text-[11px] font-bold text-white shadow">
                  -{off}%
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <Price cents={product.price_cents} size="sm" className="text-price" />
                <span className="text-[11px] text-fg-subtle line-through">
                  ${(product.list_price_cents / 100).toFixed(2)}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] font-semibold text-success">
                Save {formatPrice(savingsCents(product))}
              </p>

              <p className="mt-1 line-clamp-2-safe text-xs leading-snug text-fg-muted group-hover:text-link-hover">
                {product.title}
              </p>

              <div className="mt-2">
                <span className="block h-1.5 overflow-hidden rounded-full bg-canvas">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#f5a524,#e0553a)]"
                    style={{ width: `${claimed}%` }}
                  />
                </span>
                <span className="mt-1 block text-[10px] font-medium text-fg-subtle">
                  {claimed}% claimed
                </span>
              </div>

              <DealCountdown endsAt={endsAt} className="mt-1.5" compact />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

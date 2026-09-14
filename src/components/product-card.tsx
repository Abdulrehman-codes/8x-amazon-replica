import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/ui/stars";
import { Price, ListPrice } from "@/components/ui/price";
import { ExpressBadge } from "@/components/ui/express-badge";
import { deliveryDate, formatDeliveryDate } from "@/lib/delivery";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  className,
  showDelivery = true,
}: {
  product: Product;
  className?: string;
  showDelivery?: boolean;
}) {
  const eta = deliveryDate(product.ship_days);

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-card border border-border bg-surface p-3 transition hover:border-border-strong hover:shadow-[0_2px_12px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <Link
        href={`/dp/${product.slug}`}
        className="relative mb-3 block aspect-square overflow-hidden rounded"
      >
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <Link
        href={`/dp/${product.slug}`}
        className="line-clamp-2-safe text-sm leading-snug text-fg hover:text-link-hover"
      >
        {product.title}
      </Link>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Stars rating={product.rating} />
        <span className="text-xs text-link">
          {product.rating_count.toLocaleString()}
        </span>
      </div>

      <div className="mt-1.5">
        <Price cents={product.price_cents} />
      </div>
      <ListPrice
        listCents={product.list_price_cents}
        priceCents={product.price_cents}
        className="mt-1"
      />

      <div className="mt-auto pt-2">
        {product.is_prime && <ExpressBadge />}
        {showDelivery && (
          <p className="mt-0.5 text-xs text-fg-muted">
            Get it{" "}
            <span className="font-semibold text-fg">
              {formatDeliveryDate(eta)}
            </span>
          </p>
        )}
        {product.stock <= 10 && (
          <p className="mt-0.5 text-xs text-price">
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </article>
  );
}

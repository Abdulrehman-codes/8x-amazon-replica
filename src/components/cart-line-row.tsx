"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  setQty,
  removeFromCart,
  saveForLater,
  moveToCart,
} from "@/lib/actions/cart";
import { Price } from "@/components/ui/price";
import { ExpressBadge } from "@/components/ui/express-badge";
import { MAX_QTY } from "@/lib/cart";
import { deliveryDate, formatDeliveryDate } from "@/lib/delivery";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

export function CartLineRow({
  line,
  saved = false,
}: {
  line: CartLine;
  saved?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { product } = line;
  const limit = Math.min(MAX_QTY, Math.max(1, product.stock));
  const eta = deliveryDate(product.ship_days);

  function run(action: () => Promise<void>) {
    startTransition(() => {
      void action();
    });
  }

  return (
    <li
      className={cn(
        "flex gap-4 border-b border-border py-5 last:border-0",
        pending && "opacity-60",
      )}
    >
      <Link
        href={`/dp/${product.slug}`}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded bg-surface sm:h-36 sm:w-36"
      >
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="144px"
          className="object-contain"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link
            href={`/dp/${product.slug}`}
            className="max-w-xl text-base font-medium leading-snug hover:text-link-hover"
          >
            {product.title}
          </Link>
          <Price cents={product.price_cents * line.qty} />
        </div>

        <p className="mt-1 text-xs text-fg-muted">
          {product.stock > 0 ? (
            <span className="text-success">In stock</span>
          ) : (
            <span className="text-price">Out of stock</span>
          )}
          {product.brand && <> · {product.brand}</>}
        </p>

        {product.is_prime && <ExpressBadge className="mt-1" />}

        {!saved && (
          <p className="mt-1 text-xs text-fg-muted">
            Arrives{" "}
            <span className="font-semibold text-fg">
              {formatDeliveryDate(eta)}
            </span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {pending && (
            <Loader2 size={14} className="animate-spin text-fg-subtle" />
          )}

          {!saved && (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Quantity</span>
              <select
                value={line.qty}
                disabled={pending}
                onChange={(event) =>
                  run(() => setQty(product.id, Number(event.target.value)))
                }
                className="cursor-pointer rounded border border-border-strong bg-canvas px-2 py-1 text-sm outline-none"
              >
                {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Qty: {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="text-border-strong">|</span>

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeFromCart(product.id))}
            className="text-link hover:text-link-hover"
          >
            Delete
          </button>

          <span className="text-border-strong">|</span>

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                saved ? moveToCart(product.id) : saveForLater(product.id),
              )
            }
            className="text-link hover:text-link-hover"
          >
            {saved ? "Move to cart" : "Save for later"}
          </button>
        </div>
      </div>
    </li>
  );
}

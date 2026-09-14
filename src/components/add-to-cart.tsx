"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { addToCart } from "@/lib/actions/cart";
import { MAX_QTY } from "@/lib/cart-cookie";
import { cn } from "@/lib/utils";

export function AddToCart({
  productId,
  stock,
  className,
}: {
  productId: string;
  stock: number;
  className?: string;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const limit = Math.min(MAX_QTY, Math.max(1, stock));

  function submit(thenCheckout: boolean) {
    startTransition(async () => {
      await addToCart(productId, qty);
      if (thenCheckout) {
        router.push("/cart");
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    });
  }

  if (stock <= 0) {
    return (
      <p className={cn("rounded-md bg-canvas px-4 py-3 text-sm text-fg-muted", className)}>
        Currently unavailable. We don&apos;t know when or if this item will be
        back in stock.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-fg-muted">Quantity:</span>
        <select
          value={qty}
          onChange={(event) => setQty(Number(event.target.value))}
          className="cursor-pointer rounded border border-border-strong bg-canvas px-2 py-1 text-sm outline-none"
        >
          {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => submit(false)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:opacity-70"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : added ? (
          <Check size={16} strokeWidth={3} />
        ) : null}
        {added ? "Added to cart" : "Add to cart"}
      </button>

      <button
        type="button"
        onClick={() => submit(true)}
        disabled={pending}
        className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition hover:bg-ink-hover disabled:opacity-70"
      >
        Buy now
      </button>
    </div>
  );
}

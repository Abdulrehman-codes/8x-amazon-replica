"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShoppingCart, Zap } from "lucide-react";
import { addToCart } from "@/lib/actions/cart";
import { MAX_QTY } from "@/lib/cart-cookie";
import { flyToCart } from "@/lib/fly-to-cart";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export function AddToCart({
  productId,
  stock,
  title,
  image,
  className,
}: {
  productId: string;
  stock: number;
  title?: string;
  image?: string;
  className?: string;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const limit = Math.min(MAX_QTY, Math.max(1, stock));

  function submit(thenCheckout: boolean) {
    // Fire the flight before awaiting the server: the point of it is that the
    // interface answers instantly.
    if (!thenCheckout) {
      flyToCart(document.querySelector<HTMLElement>("[data-product-image]"));
    }

    startTransition(async () => {
      await addToCart(productId, qty);

      if (thenCheckout) {
        router.push("/cart");
        return;
      }

      setAdded(true);
      toast({
        title: qty > 1 ? `${qty} added to your cart` : "Added to your cart",
        body: title,
        image,
        href: "/cart",
        hrefLabel: "Go to cart →",
      });
      setTimeout(() => setAdded(false), 2400);
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
          className="cursor-pointer rounded border border-border-strong bg-canvas px-2 py-1 text-sm outline-none transition focus:border-link"
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
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70",
          added
            ? "bg-success text-white"
            : "bg-accent text-ink hover:bg-accent-hover hover:shadow-md",
        )}
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : added ? (
          <Check size={16} strokeWidth={3} />
        ) : (
          <ShoppingCart size={16} />
        )}
        {added ? "Added to cart" : "Add to cart"}
      </button>

      <button
        type="button"
        onClick={() => submit(true)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-hover active:scale-[0.98] disabled:opacity-70"
      >
        <Zap size={15} fill="currentColor" strokeWidth={0} />
        Buy now
      </button>
    </div>
  );
}

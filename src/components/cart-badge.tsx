"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The cart count, which pops when it changes.
 *
 * The number itself is rendered on the server; this only notices that it moved
 * and reacts, so the badge is never wrong while waiting for JavaScript.
 */
export function CartBadge({ count }: { count: number }) {
  const [bumping, setBumping] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (previous.current === count) return;
    previous.current = count;
    setBumping(true);
    const timer = setTimeout(() => setBumping(false), 420);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <span
      data-cart-target
      className={cn(
        "absolute -top-1 left-1/2 min-w-5 -translate-x-1/2 rounded-full bg-accent px-1 text-center text-xs font-bold text-ink",
        bumping && "animate-pop",
      )}
    >
      {count}
    </span>
  );
}

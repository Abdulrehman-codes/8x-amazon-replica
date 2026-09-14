"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PROMOS } from "@/lib/deals";

/**
 * The thin band under the department bar, cycling through the things worth
 * knowing before you shop. One line at a time — a row of competing banners is
 * the clutter this rebuild is trying to avoid.
 */
export function PromoStrip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PROMOS.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const promo = PROMOS[index];

  return (
    <div className="border-b border-border bg-accent-soft">
      <div className="mx-auto flex max-w-[1500px] items-center justify-center gap-2 px-3 py-1.5 text-center">
        <Sparkles size={13} className="shrink-0 text-accent" />
        <Link
          key={index}
          href={promo.href}
          className="animate-fade-up truncate text-xs font-medium text-fg hover:underline"
        >
          {promo.text}
        </Link>
      </div>
    </div>
  );
}

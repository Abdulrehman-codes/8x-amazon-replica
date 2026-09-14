"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import type { Product } from "@/lib/types";

export function ProductRail({
  title,
  href,
  products,
}: {
  title: string;
  href?: string;
  products: Product[];
}) {
  const track = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (!products.length) return null;

  return (
    <section className="rounded-card bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-link hover:text-link-hover">
            See more
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={track}
          className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-1 no-scrollbar"
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/dp/${product.slug}`}
              className="group w-[9.5rem] shrink-0 snap-start sm:w-[11rem]"
            >
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-canvas">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  sizes="180px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="line-clamp-2-safe text-xs leading-snug text-fg group-hover:text-link-hover">
                {product.title}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <Stars rating={product.rating} size={12} />
                <span className="text-[11px] text-fg-subtle">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <Price cents={product.price_cents} size="sm" className="mt-0.5" />
            </Link>
          ))}
        </div>

        <RailButton side="left" onClick={() => scrollBy(-1)} />
        <RailButton side="right" onClick={() => scrollBy(1)} />
      </div>
    </section>
  );
}

function RailButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-1/2 hidden h-20 w-9 -translate-y-1/2 items-center justify-center rounded border border-border bg-surface/95 shadow-md transition hover:bg-canvas md:flex ${
        side === "left" ? "-left-1" : "-right-1"
      }`}
    >
      <Icon size={20} />
    </button>
  );
}

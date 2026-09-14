"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Thumbnail rail plus a magnifier. Hovering tracks the cursor and shows the
 * image at 2x in a panel beside it, which is how the original lets you read
 * the small print on a box without opening anything.
 */
export function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const active = images[index] ?? images[0];

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="flex gap-3">
      {images.length > 1 && (
        <div className="flex w-14 shrink-0 flex-col gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-square overflow-hidden rounded border bg-surface transition",
                i === index
                  ? "border-link ring-1 ring-link"
                  : "border-border hover:border-border-strong",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      <div
        className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-card bg-surface"
        onMouseMove={handleMove}
        onMouseLeave={() => setOrigin(null)}
      >
        <Image
          src={active}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-contain p-4"
        />

        {origin && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-surface bg-no-repeat lg:block"
            style={{
              backgroundImage: `url(${active})`,
              backgroundSize: "200%",
              backgroundPosition: `${origin.x}% ${origin.y}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

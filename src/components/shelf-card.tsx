import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Shelf } from "@/lib/shelves";

/**
 * One merchandised card: a headline, a 2x2 of labelled tiles, and a way
 * deeper. The whole card is not a single link — each tile goes somewhere more
 * specific than the card as a whole, which is the point of the format.
 */
export function ShelfCard({ shelf }: { shelf: Shelf }) {
  return (
    <article className="flex flex-col rounded-card bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={shelf.href} className="group mb-3 flex items-start justify-between gap-2">
        <h2 className="text-[1.0625rem] font-bold leading-snug tracking-tight group-hover:text-link-hover">
          {shelf.title}
        </h2>
        <ChevronRight
          size={18}
          className="mt-0.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-link"
        />
      </Link>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {shelf.tiles.slice(0, 4).map((tile) => (
          <Link key={tile.href + tile.label} href={tile.href} className="group block">
            <div className="relative aspect-square overflow-hidden rounded bg-canvas">
              <Image
                src={tile.image}
                alt=""
                fill
                sizes="(max-width: 640px) 40vw, 160px"
                className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.07]"
              />
            </div>
            <p className="mt-1 truncate text-[11px] leading-tight text-fg-muted group-hover:text-link-hover">
              {tile.label}
            </p>
          </Link>
        ))}
      </div>

      <Link
        href={shelf.href}
        className="mt-auto pt-3 text-sm text-link hover:text-link-hover"
      >
        {shelf.linkLabel}
      </Link>
    </article>
  );
}

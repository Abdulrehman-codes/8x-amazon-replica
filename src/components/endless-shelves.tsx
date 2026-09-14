"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ShelfCard } from "@/components/shelf-card";
import type { Shelf } from "@/lib/shelves";

/**
 * Loads more of the home grid as the visitor approaches the bottom.
 *
 * The first batch is server-rendered and passed in, so the page is complete
 * without JavaScript and this only ever extends it. The sentinel sits a long
 * way below the fold, which means the next batch is usually already in place
 * by the time it would have been needed.
 */
export function EndlessShelves({
  initial,
  initialOffset,
  initialDone,
}: {
  initial: Shelf[];
  initialOffset: number;
  initialDone: boolean;
}) {
  const [shelves, setShelves] = useState(initial);
  const [offset, setOffset] = useState(initialOffset);
  const [done, setDone] = useState(initialDone);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const res = await fetch(`/api/shelves?offset=${offset}`);
      if (!res.ok) throw new Error(String(res.status));
      const data: { shelves: Shelf[]; nextOffset: number; done: boolean } =
        await res.json();

      setShelves((current) => [...current, ...data.shelves]);
      setOffset(data.nextOffset);
      setDone(data.done);
    } catch {
      // Leave the button in place so the visitor can retry deliberately.
      setFailed(true);
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, [offset, done]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || done) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, done]);

  return (
    <>
      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shelves.map((shelf) => (
          <ShelfCard key={shelf.id} shelf={shelf} />
        ))}
      </div>

      <div ref={sentinel} className="py-6 text-center">
        {loading && (
          <span className="inline-flex items-center gap-2 text-sm text-fg-muted">
            <Loader2 size={15} className="animate-spin" />
            Loading more
          </span>
        )}

        {failed && !loading && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-full border border-border-strong bg-surface px-5 py-2 text-sm font-semibold transition hover:bg-canvas"
          >
            Couldn&apos;t load more — try again
          </button>
        )}

        {done && !loading && (
          <p className="text-sm text-fg-subtle">
            That&apos;s the whole storefront — use search to go deeper.
          </p>
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { buildHref, type RawSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  raw,
}: {
  page: number;
  pageCount: number;
  raw: RawSearchParams;
}) {
  if (pageCount <= 1) return null;

  // A window around the current page, so 40 pages do not become 40 links.
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      aria-label="Search results pages"
      className="flex items-center justify-center gap-1 pt-8"
    >
      <PageLink
        href={buildHref(raw, { page: page - 1 })}
        disabled={page === 1}
      >
        Previous
      </PageLink>

      {pages.map((n) => (
        <PageLink key={n} href={buildHref(raw, { page: n })} current={n === page}>
          {n}
        </PageLink>
      ))}

      <PageLink
        href={buildHref(raw, { page: page + 1 })}
        disabled={page === pageCount}
      >
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  current,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "min-w-9 rounded border px-3 py-1.5 text-center text-sm transition",
    current
      ? "border-accent bg-accent font-semibold text-ink"
      : "border-border-strong bg-surface text-fg hover:bg-canvas",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={current ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

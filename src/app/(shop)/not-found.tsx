import Link from "next/link";
import { PackageSearch } from "lucide-react";

/**
 * 404 inside the storefront. Scoped to the (shop) group so it renders with
 * the header and its search box — a shopper who lands on a dead product link
 * should be one keystroke from finding the right one, not staring at a
 * chrome-less page.
 */
export default function ShopNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-16">
      <div className="rounded-card bg-surface px-6 py-14 text-center shadow-sm">
        <PackageSearch size={44} strokeWidth={1.25} className="mx-auto text-fg-subtle" />
        <h1 className="mt-4 text-2xl font-semibold">
          We can&apos;t find that page
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          The link may be broken, or the product may no longer be sold here.
          Try the search box above, or pick up from one of these.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
          >
            Back to the storefront
          </Link>
          <Link
            href="/s?deals=1"
            className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold transition hover:bg-canvas"
          >
            Today&apos;s deals
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fg-subtle">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        We can&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm text-fg-muted">
        The link may be broken, or the product may no longer be sold here. The
        search box at the top of the store is the fastest way back.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
        >
          Back to the storefront
        </Link>
        <Link
          href="/s"
          className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold transition hover:bg-surface"
        >
          Browse everything
        </Link>
      </div>
    </main>
  );
}

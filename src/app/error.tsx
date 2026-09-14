"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        Something went wrong on our end
      </h1>
      <p className="mt-3 max-w-md text-sm text-fg-muted">
        The page failed to load. Trying again usually works — if it doesn&apos;t,
        head back to the storefront.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-fg-subtle">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold transition hover:bg-surface"
        >
          Back to the storefront
        </Link>
      </div>
    </main>
  );
}

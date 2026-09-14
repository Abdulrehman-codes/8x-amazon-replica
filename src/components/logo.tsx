import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark with a delivery-arc underline sweeping from b to r. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Bazaar home"
      className={cn(
        "relative shrink-0 rounded px-1 py-1 transition hover:opacity-90",
        className,
      )}
    >
      <span className="block text-2xl font-bold leading-none tracking-tight text-white">
        bazaar
      </span>
      <svg
        viewBox="0 0 84 10"
        className="mt-0.5 h-2 w-[5.2rem] text-accent"
        aria-hidden="true"
      >
        <path
          d="M2 2.5C18 8.5 62 8.5 78 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M72 1.2L79.5 2.6L75.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

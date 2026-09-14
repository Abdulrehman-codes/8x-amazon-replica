"use client";

import { useRouter } from "next/navigation";
import { buildHref, SORT_LABELS, type RawSearchParams } from "@/lib/search-params";
import type { SortKey } from "@/lib/types";

export function SortSelect({
  raw,
  value,
}: {
  raw: RawSearchParams;
  value: SortKey;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-fg-muted">Sort by:</span>
      <select
        value={value}
        onChange={(event) =>
          router.push(buildHref(raw, { sort: event.target.value }))
        }
        className="cursor-pointer rounded border border-border-strong bg-surface px-2 py-1.5 text-sm outline-none"
      >
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

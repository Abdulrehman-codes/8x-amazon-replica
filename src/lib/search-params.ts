import type { SearchParamsShape } from "./queries";
import type { SortKey } from "./types";

const SORTS: SortKey[] = ["featured", "price-asc", "price-desc", "rating", "newest"];

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Avg. customer review",
  newest: "Newest arrivals",
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function int(value: string | string[] | undefined) {
  const parsed = Number.parseInt(one(value) ?? "", 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseSearchParams(raw: RawSearchParams): SearchParamsShape {
  const sort = one(raw.sort) as SortKey | undefined;

  return {
    q: one(raw.k)?.trim() || undefined,
    department: one(raw.department) || undefined,
    category: one(raw.category) || undefined,
    brands: one(raw.brands)?.split(",").filter(Boolean),
    minPrice: int(raw.minPrice),
    maxPrice: int(raw.maxPrice),
    minRating: int(raw.rating),
    prime: one(raw.prime) === "1",
    deals: one(raw.deals) === "1",
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    page: int(raw.page) ?? 1,
  };
}

/**
 * Builds the href for a filter control: merges a patch into the current query,
 * drops empty values, and resets paging because page 4 of the old result set
 * is meaningless against a new one.
 */
export function buildHref(
  current: RawSearchParams,
  patch: Record<string, string | number | null | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    const single = one(value);
    if (single) params.set(key, single);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  if (!("page" in patch)) params.delete("page");

  const query = params.toString();
  return query ? `/s?${query}` : "/s";
}

export function toggleInList(
  currentValue: string | undefined,
  item: string,
): string | null {
  const items = new Set(currentValue?.split(",").filter(Boolean) ?? []);
  if (items.has(item)) items.delete(item);
  else items.add(item);
  return items.size ? [...items].join(",") : null;
}

export const PRICE_BRACKETS = [
  { label: "Under $25", min: undefined, max: 2500 },
  { label: "$25 to $50", min: 2500, max: 5000 },
  { label: "$50 to $100", min: 5000, max: 10000 },
  { label: "$100 to $250", min: 10000, max: 25000 },
  { label: "$250 & above", min: 25000, max: undefined },
];

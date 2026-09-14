import Link from "next/link";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { MobileFilters } from "@/components/mobile-filters";
import { SortSelect } from "@/components/sort-select";
import { Pagination } from "@/components/pagination";
import { searchProducts, getCategory, getDepartment, PAGE_SIZE } from "@/lib/queries";
import { parseSearchParams, type RawSearchParams } from "@/lib/search-params";
import { getLocation, transitDaysFor } from "@/lib/location";

export const metadata: Metadata = { title: "Search results" };

export default async function SearchPage({ searchParams }: PageProps<"/s">) {
  const raw = (await searchParams) as RawSearchParams;
  const params = parseSearchParams(raw);
  const [result, location] = await Promise.all([
    searchProducts(params),
    getLocation(),
  ]);
  const extraDays = transitDaysFor(location);

  const heading = await headingFor(params.q, params.category, params.department);

  const activeFilterCount =
    (params.brands?.length ?? 0) +
    (params.category ? 1 : 0) +
    (params.minPrice != null || params.maxPrice != null ? 1 : 0) +
    (params.minRating != null ? 1 : 0) +
    (params.prime ? 1 : 0) +
    (params.deals ? 1 : 0);
  const firstIndex = (result.page - 1) * PAGE_SIZE + 1;
  const lastIndex = Math.min(result.page * PAGE_SIZE, result.total);

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-4 py-3 shadow-sm">
        <p className="text-sm text-fg-muted">
          {result.total > 0 ? (
            <>
              <span className="font-semibold text-fg">
                {firstIndex}–{lastIndex}
              </span>{" "}
              of {result.total.toLocaleString()} results
              {heading && (
                <>
                  {" "}
                  for <span className="font-semibold text-price">{heading}</span>
                </>
              )}
            </>
          ) : (
            "No results"
          )}
        </p>
        <div className="flex items-center gap-3">
          <MobileFilters activeCount={activeFilterCount}>
            <FilterSidebar facets={result.facets} raw={raw} />
          </MobileFilters>
          <SortSelect raw={raw} value={params.sort ?? "featured"} />
        </div>
      </div>

      <div className="flex gap-5">
        <div className="hidden lg:block">
          <FilterSidebar facets={result.facets} raw={raw} />
        </div>

        <div className="min-w-0 flex-1">
          {result.items.length === 0 ? (
            <EmptyResults query={params.q} />
          ) : (
            <>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} extraDays={extraDays} />
                ))}
              </div>
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                raw={raw}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

async function headingFor(
  query?: string,
  category?: string,
  department?: string,
) {
  if (query) return `"${query}"`;
  if (category) return (await getCategory(category))?.name ?? null;
  if (department) return (await getDepartment(department))?.name ?? null;
  return null;
}

function EmptyResults({ query }: { query?: string }) {
  return (
    <div className="rounded-card bg-surface px-6 py-16 text-center shadow-sm">
      <SearchX size={40} className="mx-auto text-fg-subtle" />
      <h1 className="mt-4 text-xl font-bold">
        No results{query ? ` for "${query}"` : ""}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
        Try a shorter or more general search term, or loosen the filters on the
        left — the price and brand filters are the usual culprits.
      </p>
      <Link
        href="/s"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
      >
        Browse everything
      </Link>
    </div>
  );
}

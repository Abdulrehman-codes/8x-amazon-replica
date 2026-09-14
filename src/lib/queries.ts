import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabasePublic } from "./supabase/public";
import type { Category, Department, Product, Review, SortKey } from "./types";

export const PAGE_SIZE = 24;

/** Invalidation tag for everything the seed script writes. */
const CATALOG_TAG = "catalog";

/**
 * Explicit column list instead of `*`.
 *
 * `select("*")` also returns `search_tsv`, the generated tsvector, which is
 * useless to the client and travels on every row of every list — it was a
 * significant share of the home page's payload.
 */
const PRODUCT_COLUMNS =
  "id,slug,title,brand,description,bullets,category_slug,price_cents," +
  "list_price_cents,rating,rating_count,stock,images,tags,ship_days," +
  "is_prime,return_policy,warranty";

/**
 * Catalog reads are wrapped twice on purpose:
 *
 *   unstable_cache  persists the result across requests, because the catalog
 *                   only changes when the seed script runs.
 *   cache (React)   collapses repeat calls within a single render — the nav
 *                   was being fetched three times per page, once each by the
 *                   header, the footer and the home page.
 */
function catalogQuery<Args extends unknown[], Result>(
  keyParts: string[],
  fn: (...args: Args) => Promise<Result>,
  revalidate = 3600,
): (...args: Args) => Promise<Result> {
  const persisted = unstable_cache(
    fn as (...args: unknown[]) => Promise<Result>,
    keyParts,
    { revalidate, tags: [CATALOG_TAG] },
  );
  return cache(persisted) as (...args: Args) => Promise<Result>;
}

export type DepartmentWithCategories = Department & { categories: Category[] };

/**
 * Deduped within a render but deliberately NOT cached across requests.
 *
 * The nav is two small indexed reads, and it is the most visible thing in the
 * app — a department added by a re-seed should appear immediately rather than
 * whenever a TTL happens to lapse. The expensive product queries below are the
 * ones worth persisting.
 */
export const getNav = cache(async (): Promise<
  DepartmentWithCategories[]
> => {
  const [{ data: departments }, { data: categories }] = await Promise.all([
    supabasePublic.from("departments").select("*").order("sort"),
    supabasePublic.from("categories").select("*").order("sort"),
  ]);

  return (departments ?? []).map((d) => ({
    ...d,
    categories: (categories ?? []).filter((c) => c.department_slug === d.slug),
  }));
});

export const getCategory = catalogQuery(
  ["category"],
  async (slug: string): Promise<Category | null> => {
    const { data } = await supabasePublic
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data as Category | null;
  },
);

export const getDepartment = catalogQuery(
  ["department"],
  async (slug: string): Promise<Department | null> => {
    const { data } = await supabasePublic
      .from("departments")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data as Department | null;
  },
);

export type SearchParamsShape = {
  q?: string;
  department?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  prime?: boolean;
  deals?: boolean;
  sort?: SortKey;
  page?: number;
};

export type Facets = {
  brands: { value: string; count: number }[];
  categories: { slug: string; name: string; count: number }[];
  priceBounds: { min: number; max: number };
};

export type SearchResult = {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  facets: Facets;
};

/**
 * Catalog search. Filtering, faceting, sorting and paging all happen inside
 * `search_catalog` (see supabase/search-function.sql) so the server returns
 * exactly one page plus its facet counts, rather than the whole match set.
 */
export const searchProducts = catalogQuery(
  ["search"],
  async (params: SearchParamsShape): Promise<SearchResult> => {
    const requestedPage = Math.max(1, params.page ?? 1);

    const { data, error } = await supabasePublic.rpc("search_catalog", {
      q: params.q?.trim() || null,
      dept: params.department ?? null,
      cat: params.category ?? null,
      brand_list: params.brands?.length ? params.brands : null,
      min_price: params.minPrice ?? null,
      max_price: params.maxPrice ?? null,
      min_rating: params.minRating ?? null,
      prime_only: params.prime ?? false,
      deals_only: params.deals ?? false,
      sort_key: params.sort ?? "featured",
      page_num: requestedPage,
      page_size: PAGE_SIZE,
    });
    if (error) throw error;

    const payload = data as unknown as {
      total: number;
      items: Product[];
      facets: Facets;
    } | null;

    const total = payload?.total ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      items: payload?.items ?? [],
      total,
      page: Math.min(requestedPage, pageCount),
      pageCount,
      facets:
        payload?.facets ?? {
          brands: [],
          categories: [],
          priceBounds: { min: 0, max: 0 },
        },
    };
  },
  600,
);

export const getProduct = catalogQuery(
  ["product"],
  async (slug: string): Promise<Product | null> => {
    const { data } = await supabasePublic
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    return data as unknown as Product | null;
  },
);

export const getReviews = catalogQuery(
  ["reviews"],
  async (productId: string): Promise<Review[]> => {
    const { data } = await supabasePublic
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Review[];
  },
);

export const getRelated = catalogQuery(
  ["related"],
  async (
    categorySlug: string,
    excludeId: string,
    limit: number = 12,
  ): Promise<Product[]> => {
    const { data } = await supabasePublic
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("category_slug", categorySlug)
      .neq("id", excludeId)
      .order("rating", { ascending: false })
      .limit(limit);
    return (data ?? []) as unknown as Product[];
  },
);

/** Cheap "bought together" stand-in: the two best-rated peers under the price. */
export const getBoughtTogether = catalogQuery(
  ["bought-together"],
  async (
    categorySlug: string,
    excludeId: string,
    maxPriceCents: number,
  ): Promise<Product[]> => {
    const { data } = await supabasePublic
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("category_slug", categorySlug)
      .neq("id", excludeId)
      .lte("price_cents", maxPriceCents)
      .order("rating", { ascending: false })
      .limit(2);
    return (data ?? []) as unknown as Product[];
  },
);

/** Cart hydration is per-visitor, so it is deduped but never cached across requests. */
export const getProductsByIds = cache(
  async (ids: string[]): Promise<Product[]> => {
    if (!ids.length) return [];
    const { data } = await supabasePublic
      .from("products")
      .select(PRODUCT_COLUMNS)
      .in("id", ids);
    return (data ?? []) as unknown as Product[];
  },
);

export const getHomeData = catalogQuery(["home"], async () => {
  const [{ data: deals }, { data: topRated }, { data: underTwentyFive }, nav] =
    await Promise.all([
      supabasePublic
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("rating", { ascending: false })
        .limit(60),
      supabasePublic
        .from("products")
        .select(PRODUCT_COLUMNS)
        .gte("rating", 4.5)
        .order("rating_count", { ascending: false })
        .limit(14),
      supabasePublic
        .from("products")
        .select(PRODUCT_COLUMNS)
        .lte("price_cents", 2500)
        .order("rating", { ascending: false })
        .limit(14),
      getNav(),
    ]);

  const dealProducts = ((deals ?? []) as unknown as Product[])
    .filter((p) => p.list_price_cents > p.price_cents)
    .sort(
      (a, b) =>
        1 - a.price_cents / a.list_price_cents -
        (1 - b.price_cents / b.list_price_cents),
    )
    .slice(0, 14);

  return {
    nav,
    deals: dealProducts,
    topRated: (topRated ?? []) as unknown as Product[],
    underTwentyFive: (underTwentyFive ?? []) as unknown as Product[],
  };
});

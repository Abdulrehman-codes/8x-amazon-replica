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

export const getNav = catalogQuery(["nav"], async (): Promise<
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
 * Text matching runs in Postgres; faceting and paging run here.
 *
 * With a catalog this size the whole match set fits comfortably in memory,
 * and computing facets in JS gives exact counts for free. A catalog an order
 * of magnitude larger would want this as a Postgres function instead.
 */
export const searchProducts = catalogQuery(
  ["search"],
  async (params: SearchParamsShape): Promise<SearchResult> => {
    const embed = `${PRODUCT_COLUMNS}, categories!inner(slug, name, department_slug)`;

    let query = supabasePublic.from("products").select(embed);

    if (params.category) query = query.eq("category_slug", params.category);
    if (params.department) {
      query = query.eq("categories.department_slug", params.department);
    }

    if (params.q?.trim()) {
      query = query.textSearch("search_tsv", params.q.trim(), {
        type: "websearch",
        config: "english",
      });
    }

    const { data, error } = await query.limit(1000);
    if (error) throw error;

    let matched = (data ?? []) as unknown as (Product & {
      categories: Category;
    })[];

    // Full-text search is precise but unforgiving of partial words; fall back
    // to a substring match so "head" still finds "Headphones".
    if (params.q?.trim() && matched.length === 0) {
      const term = params.q.trim();
      let fallback = supabasePublic
        .from("products")
        .select(embed)
        .or(`title.ilike.%${term}%,brand.ilike.%${term}%`);
      if (params.category) {
        fallback = fallback.eq("category_slug", params.category);
      }
      if (params.department) {
        fallback = fallback.eq("categories.department_slug", params.department);
      }
      const { data: loose } = await fallback.limit(1000);
      matched = (loose ?? []) as unknown as (Product & {
        categories: Category;
      })[];
    }

    // Facets are computed before the price/brand/rating filters are applied so
    // the sidebar keeps showing the options a shopper can still switch to.
    const facets = buildFacets(matched);

    let items: Product[] = matched;
    if (params.brands?.length) {
      const wanted = new Set(params.brands);
      items = items.filter((p) => p.brand && wanted.has(p.brand));
    }
    if (params.minPrice != null) {
      items = items.filter((p) => p.price_cents >= params.minPrice!);
    }
    if (params.maxPrice != null) {
      items = items.filter((p) => p.price_cents <= params.maxPrice!);
    }
    if (params.minRating != null) {
      items = items.filter((p) => p.rating >= params.minRating!);
    }
    if (params.prime) items = items.filter((p) => p.is_prime);
    if (params.deals) {
      items = items.filter((p) => p.list_price_cents > p.price_cents);
    }

    items = sortProducts(items, params.sort ?? "featured");

    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
    const start = (page - 1) * PAGE_SIZE;

    return {
      items: items.slice(start, start + PAGE_SIZE),
      total,
      page,
      pageCount,
      facets,
    };
  },
  600,
);

function buildFacets(products: (Product & { categories?: Category })[]): Facets {
  const brands = new Map<string, number>();
  const categories = new Map<string, { name: string; count: number }>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const p of products) {
    if (p.brand) brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1);
    const catName = p.categories?.name ?? p.category_slug;
    const existing = categories.get(p.category_slug);
    categories.set(p.category_slug, {
      name: catName,
      count: (existing?.count ?? 0) + 1,
    });
    min = Math.min(min, p.price_cents);
    max = Math.max(max, p.price_cents);
  }

  return {
    brands: [...brands.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    categories: [...categories.entries()]
      .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count),
    priceBounds: {
      min: Number.isFinite(min) ? min : 0,
      max,
    },
  };
}

function sortProducts(items: Product[], sort: SortKey) {
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price_cents - b.price_cents);
    case "price-desc":
      return copy.sort((a, b) => b.price_cents - a.price_cents);
    case "rating":
      return copy.sort(
        (a, b) => b.rating - a.rating || b.rating_count - a.rating_count,
      );
    case "newest":
      return copy.sort((a, b) => a.slug.localeCompare(b.slug));
    default:
      // "Featured" blends score and volume so a lone 5-star review does not
      // outrank a 4.6 with two thousand.
      return copy.sort(
        (a, b) =>
          b.rating * Math.log10(b.rating_count + 10) -
          a.rating * Math.log10(a.rating_count + 10),
      );
  }
}

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

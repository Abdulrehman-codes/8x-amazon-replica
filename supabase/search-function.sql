-- Catalog search: filtering, faceting, sorting and paging in one round trip.
--
-- This replaces an in-memory implementation that fetched every matching row
-- and counted facets in JavaScript. That is fine for a few hundred products
-- and quietly quadratic for a few thousand, so the work moves to Postgres.
--
-- Run this in the Supabase SQL editor. Safe to re-run.

create extension if not exists pg_trgm;

create or replace function public.search_catalog(
  q           text    default null,
  dept        text    default null,
  cat         text    default null,
  brand_list  text[]  default null,
  min_price   int     default null,
  max_price   int     default null,
  min_rating  numeric default null,
  prime_only  boolean default false,
  deals_only  boolean default false,
  sort_key    text    default 'featured',
  page_num    int     default 1,
  page_size   int     default 24
)
returns jsonb
language sql
stable
parallel safe
as $search$
with scoped as (
  -- Everything matching the query and its department/category scope.
  -- Facets are counted over this, deliberately before the narrowing filters,
  -- so the sidebar keeps offering options a shopper can still move to.
  select p.*, c.name as category_name
  from products p
  join categories c on c.slug = p.category_slug
  where (
      q is null
      or q = ''
      -- Full-text first, with a substring fallback in the same pass so
      -- "head" still finds "Headphones".
      or p.search_tsv @@ websearch_to_tsquery('english', q)
      or p.title ilike '%' || q || '%'
      or p.brand ilike '%' || q || '%'
    )
    and (cat  is null or p.category_slug = cat)
    and (dept is null or c.department_slug = dept)
),
filtered as (
  select * from scoped
  where (brand_list is null or brand = any (brand_list))
    and (min_price  is null or price_cents >= min_price)
    and (max_price  is null or price_cents <= max_price)
    and (min_rating is null or rating      >= min_rating)
    and (not prime_only or is_prime)
    and (not deals_only or list_price_cents > price_cents)
),
total as (select count(*)::int as n from filtered),
page as (
  select *
  from filtered
  order by
    case when sort_key = 'price-asc'  then price_cents end asc  nulls last,
    case when sort_key = 'price-desc' then price_cents end desc nulls last,
    case when sort_key = 'rating'     then rating      end desc nulls last,
    case when sort_key = 'newest'     then created_at  end desc nulls last,
    -- "Featured" blends score and volume so a lone 5-star review does not
    -- outrank a 4.6 with two thousand.
    case
      when sort_key not in ('price-asc', 'price-desc', 'rating', 'newest')
      then rating * log(rating_count + 10)
    end desc nulls last,
    id
  limit  greatest(page_size, 1)
  offset greatest(page_num - 1, 0) * greatest(page_size, 1)
)
select jsonb_build_object(
  'total', (select n from total),
  'items', coalesce(
    (
      select jsonb_agg(to_jsonb(pg) - 'search_tsv' - 'category_name')
      from page pg
    ),
    '[]'::jsonb
  ),
  'facets', jsonb_build_object(
    'brands', coalesce(
      (
        select jsonb_agg(jsonb_build_object('value', brand, 'count', n))
        from (
          select brand, count(*)::int as n
          from scoped
          where brand is not null and brand <> ''
          group by brand
          order by n desc, brand
          limit 20
        ) b
      ),
      '[]'::jsonb
    ),
    'categories', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('slug', category_slug, 'name', category_name, 'count', n)
        )
        from (
          select category_slug, category_name, count(*)::int as n
          from scoped
          group by category_slug, category_name
          order by n desc
          limit 15
        ) c
      ),
      '[]'::jsonb
    ),
    'priceBounds', (
      select jsonb_build_object(
        'min', coalesce(min(price_cents), 0),
        'max', coalesce(max(price_cents), 0)
      )
      from scoped
    )
  )
);
$search$;

-- Readable by the anon role, like the rest of the catalog.
grant execute on function public.search_catalog(
  text, text, text, text[], int, int, numeric, boolean, boolean, text, int, int
) to anon, authenticated;

-- Supporting indexes for the new filter and sort paths. The trigram index
-- backs the ilike fallback, so its extension has to exist first.
create extension if not exists pg_trgm;

create index if not exists products_brand_idx      on products (brand);
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_title_trgm_idx on products using gin (title gin_trgm_ops);

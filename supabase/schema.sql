-- Bazaar storefront schema
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ---------------------------------------------------------------- catalog --
-- Catalog tables are world-readable; only the seed script (service role)
-- writes to them, so they carry RLS with a public SELECT policy and no
-- write policy at all.

create table if not exists departments (
  slug text primary key,
  name text not null,
  sort int not null default 0
);

create table if not exists categories (
  slug            text primary key,
  name            text not null,
  department_slug text not null references departments (slug) on delete cascade,
  image_url       text,
  sort            int not null default 0
);

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  brand            text,
  description      text not null,
  bullets          text[] not null default '{}',
  category_slug    text not null references categories (slug) on delete cascade,
  price_cents      int not null check (price_cents >= 0),
  list_price_cents int not null check (list_price_cents >= 0),
  rating           numeric(2, 1) not null default 0,
  rating_count     int not null default 0,
  stock            int not null default 0,
  images           text[] not null default '{}',
  tags             text[] not null default '{}',
  ship_days        int not null default 5,
  is_prime         boolean not null default false,
  return_policy    text,
  warranty         text,
  created_at       timestamptz not null default now()
);

-- Full-text search over the fields a shopper actually types.
alter table products
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored;

create index if not exists products_search_idx   on products using gin (search_tsv);
create index if not exists products_category_idx on products (category_slug);
create index if not exists products_price_idx    on products (price_cents);
create index if not exists products_rating_idx   on products (rating desc);

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  author_name text not null,
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text not null,
  verified    boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on reviews (product_id);

-- -------------------------------------------------------------- customer --

create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  full_name   text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  postal_code text not null,
  country     text not null default 'United States',
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on addresses (user_id);

-- The cart deliberately lives in an httpOnly cookie rather than a table, so a
-- signed-out visitor can fill one and only has to authenticate at checkout.

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  status         text not null default 'placed'
                 check (status in ('placed', 'preparing', 'shipped', 'out_for_delivery', 'delivered')),
  subtotal_cents int not null,
  shipping_cents int not null default 0,
  tax_cents      int not null default 0,
  total_cents    int not null,
  -- The address is snapshotted onto the order: editing an address later
  -- must not rewrite the history of an order already placed.
  ship_to        jsonb not null,
  payment_last4  text not null,
  payment_brand  text not null default 'Visa',
  delivery_speed text not null default 'standard',
  eta_date       date not null,
  placed_at      timestamptz not null default now()
);

create index if not exists orders_user_idx on orders (user_id, placed_at desc);

create table if not exists order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders (id) on delete cascade,
  product_id       uuid references products (id) on delete set null,
  -- Snapshotted for the same reason as ship_to above.
  title            text not null,
  slug             text not null,
  image_url        text,
  unit_price_cents int not null,
  qty              int not null check (qty > 0)
);

create index if not exists order_items_order_idx on order_items (order_id);

-- ------------------------------------------------------------------ RLS --

alter table departments enable row level security;
alter table categories  enable row level security;
alter table products    enable row level security;
alter table reviews     enable row level security;
alter table profiles    enable row level security;
alter table addresses   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

do $policies$
begin
  -- Catalog: readable by anyone, writable by nobody through the API.
  if not exists (select 1 from pg_policies where tablename = 'departments' and policyname = 'departments_read') then
    create policy departments_read on departments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'categories_read') then
    create policy categories_read on categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'products_read') then
    create policy products_read on products for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'reviews_read') then
    create policy reviews_read on reviews for select using (true);
  end if;

  -- Customer data: owner-only, all verbs.
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_own') then
    create policy profiles_own on profiles for all
      using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'addresses' and policyname = 'addresses_own') then
    create policy addresses_own on addresses for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_own') then
    create policy orders_own on orders for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  -- Order items are reachable only through an order the caller owns.
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'order_items_own') then
    create policy order_items_own on order_items for all
      using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()))
      with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end
$policies$;

-- A profile row should exist the moment a user signs up, so the header can
-- greet them by name without a second round trip.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

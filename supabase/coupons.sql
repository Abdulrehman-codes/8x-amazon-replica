-- Vouchers, and the order columns that record one being used.
-- Run in the Supabase SQL editor. Safe to re-run.

create table if not exists coupons (
  code               text primary key,
  label              text not null,
  description        text not null,
  -- percent: `value` is percentage points, capped by max_discount_cents
  -- fixed:   `value` is cents off the subtotal
  -- shipping: delivery is waived, `value` is ignored
  kind               text not null check (kind in ('percent', 'fixed', 'shipping')),
  value              int  not null default 0 check (value >= 0),
  min_spend_cents    int  not null default 0 check (min_spend_cents >= 0),
  max_discount_cents int,
  department_slug    text references departments (slug) on delete cascade,
  expires_at         timestamptz,
  active             boolean not null default true,
  sort               int not null default 0
);

-- Orders record what was taken off and by which code, so history stays
-- readable after a coupon is retired or its terms change.
alter table orders add column if not exists discount_cents int not null default 0;
alter table orders add column if not exists coupon_code text;

alter table coupons enable row level security;

do $coupons$
begin
  -- Readable by anyone (the vouchers page lists them); writable by nobody
  -- through the API, only by the seed running as the service role.
  if not exists (
    select 1 from pg_policies where tablename = 'coupons' and policyname = 'coupons_read'
  ) then
    create policy coupons_read on coupons for select using (true);
  end if;
end
$coupons$;

insert into coupons
  (code, label, description, kind, value, min_spend_cents, max_discount_cents, department_slug, sort)
values
  ('WELCOME10', '10% off your first order',
   'Ten percent off anything in the store, up to $20.',
   'percent', 10, 0, 2000, null, 0),

  ('FREESHIP', 'Free delivery, any basket',
   'Waives the delivery charge however small the order.',
   'shipping', 0, 0, null, null, 1),

  ('SAVE5', '$5 off orders over $30',
   'Five dollars straight off the subtotal.',
   'fixed', 500, 3000, null, null, 2),

  ('BOOKWORM', '15% off when you spend $25',
   'Fifteen percent off the whole basket, up to $40.',
   'percent', 15, 2500, 4000, null, 3),

  ('BIGBASKET', '$25 off orders over $150',
   'For the bigger shop — twenty-five dollars off.',
   'fixed', 2500, 15000, null, null, 4)
on conflict (code) do update set
  label              = excluded.label,
  description        = excluded.description,
  kind               = excluded.kind,
  value              = excluded.value,
  min_spend_cents    = excluded.min_spend_cents,
  max_discount_cents = excluded.max_discount_cents,
  department_slug    = excluded.department_slug,
  sort               = excluded.sort,
  active             = true;

# Bazaar

A rebuild of a large online storefront — the shopping path from landing page
to placed order, on its own brand and a calmer surface.

**Live:** _(deployed link)_ · **Demo account:** one click from the account
menu — `demo@bazaar.shop`, already carrying a saved address and two orders.

---

## What it does

| Flow | Route | Notes |
| --- | --- | --- |
| Browse | `/` | Department cards, deal rail, top-rated and under-$25 rails |
| Search | `/s` | Postgres full-text with substring fallback, faceted filters, sorting, paging |
| Product | `/dp/[slug]` | Magnifier gallery, buy box with a dated delivery promise, rating histogram, bundle |
| Cart | `/cart` | Quantity, delete, save for later, free-delivery threshold |
| Auth | `/signin`, `/signup` | Email + password, plus one-click demo sign-in |
| Checkout | `/checkout` | Address, delivery speed, payment, order summary — one page |
| Orders | `/orders`, `/orders/[id]` | History and a tracking strip that advances with real elapsed time |

## Decisions worth naming

**The cart is a cookie, not a table.** A signed-out visitor can fill a cart and
is only asked to authenticate at checkout. That removes an account wall from
the top of the funnel and a whole table's worth of RLS surface.

**Totals are recomputed on the server.** `placeOrder` reads catalog prices and
derives subtotal, shipping and tax itself. Anything the client submits about
money is ignored.

**Orders snapshot what they shipped.** The address and every line item are
copied onto the order. Editing an address or repricing a product later cannot
rewrite the history of an order already placed.

**Delivery dates are derived, not decorative.** Each product carries a handling
time parsed from its shipping terms. The buy box counts business days forward
from that, the order takes the slowest line in the basket, and the tracking
strip interpolates status from elapsed time against the estimate.

**Filters are links.** Every filtered view is a real URL — shareable,
bookmarkable, back-button-correct, and functional with JavaScript disabled.

**Facets are counted before the narrowing filters apply**, so the sidebar keeps
offering the options a shopper can still move to instead of collapsing to
whatever is already selected.

**Search paging happens in memory.** At this catalog size that buys exact facet
counts for nothing. The comment in `src/lib/queries.ts` marks where that stops
being true.

## What was deliberately left out

Third-party sellers and seller dashboards, real payment processing, returns and
refunds, streaming and subscription services, wishlists and registries, product
Q&A, customer-written reviews, coupons. All of them are visible on the original;
none is on the path from landing to placed order.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Supabase
(Postgres + Auth) · Vercel.

## Running it

```bash
npm install
cp .env.example .env.local     # fill in the three Supabase values
npm run seed                   # catalog, reviews, demo shopper
npm run dev
```

Before the first seed, run `supabase/schema.sql` once in the Supabase SQL
editor, and turn **Confirm email** off under Authentication → Providers →
Email so sign-up completes in one step.

### Environment

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server, under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only — never shipped to the client |

## Agent logs

Every prompt and response from the build is committed under `.agent-logs/`,
one file per session.

## Attribution

Bazaar is an independent portfolio exercise and is not affiliated with any
retailer. Product data and imagery come from the public
[DummyJSON](https://dummyjson.com) catalog. No real payments are processed.

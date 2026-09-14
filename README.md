# Bazaar

**An everything store, rebuilt from scratch.** Same information architecture as
the original. Considerably less shouting.

🔗 **[8x-amazon-replica.vercel.app](https://8x-amazon-replica.vercel.app)**
🔑 **Demo shopper:** one click from the account menu — no sign-up, lands on a
real order history.

---

## The short version

Someone said "rebuild Amazon." So: 2,828 real products across nine
departments, faceted search that answers in ~200ms at any page depth, a cart
you can fill without an account, a checkout that recomputes every cent on the
server, vouchers, live delivery dates that change when you change where you
live, and confetti when you finally buy something.

It is not a screenshot. Every number on the page came out of Postgres.

## Take the tour (about two minutes)

1. **Land on the home page.** Watch the hero rotate. Scroll — it keeps loading
   shelves, because a storefront that ends after two rows isn't a storefront.
2. **Hit a lightning deal.** The countdown is real, the "% claimed" bar moves
   with it, and the saving is stated in money rather than left as homework.
3. **Search `agatha`.** 78 results, because the catalog genuinely contains
   Agatha Christie. Filter by price on the left — every filter is a URL you
   can paste to someone.
4. **Open a product and hit Add to cart.** The image flies into the basket.
   It's a small thing. Small things are the job.
5. **Go to `/coupons`, clip `BOOKWORM`, then check out.** The discount appears
   in the summary *before* you commit to anything.
6. **Place the order.** Confetti. Then a tracking strip that advances as the
   delivery date approaches — not a static picture of a progress bar.

## What it's built with

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack, RSC) | Server components mean the product grid needs no client-side fetching layer |
| Language | **TypeScript** | 2,800 products and money in cents; guessing is not a strategy |
| Styling | **Tailwind v4** | One `@theme` block holds the entire palette |
| UI primitives | **Radix** | Dialogs and dropdowns that are accessible without me relitigating focus traps |
| Database | **Supabase** (Postgres + Auth) | Row-level security doing real work, not decoration |
| Search | **A Postgres function** | Filtering, faceting, sorting and paging in one round trip |
| Hosting | **Vercel** | Push to `main`, live in about fifteen seconds |
| Icons / motion | **lucide-react**, CSS keyframes, `canvas-confetti` | No animation library; the CSS was enough |

## The catalog is real

| Source | Gives us | Why it won |
| --- | --- | --- |
| [DummyJSON](https://dummyjson.com) | 194 products, 8 departments | Real photography, brands, stock, shipping terms |
| [Open Library](https://openlibrary.org) | 2,634 books, 10 subjects | Real titles, real authors, real cover art, 100 per request |

**2,828 products · 8,407 reviews · 34 categories · 35 home shelves · 5 vouchers**

Open Food Facts auditioned for a grocery department and didn't get the part:
it caps at 24 records a request and starts serving HTML error pages under
light load. Not something to build a repeatable seed on.

Open Library publishes bibliographic data, not commerce data, so book prices
and stock are derived deterministically from the title — re-seed and you get a
byte-identical catalog.

## Decisions I'd defend in a code review

**The cart is a cookie, not a table.** A signed-out visitor can fill a basket
and is only asked to authenticate at checkout. That deletes an account wall
from the top of the funnel and a whole table's worth of RLS surface.

**Every total is recomputed on the server.** `placeOrder` reads catalog prices
and derives subtotal, discount, shipping and tax itself. Anything the client
says about money is ignored on principle.

**Coupon pricing exists exactly once.** `lib/coupon-math.ts` holds no cookies
and no database access, so the checkout summary prices a voucher in the browser
as you switch delivery speed while the server prices it identically when you
buy. What you're shown and what you're charged *cannot* disagree.

**Orders snapshot what they shipped.** Address and line items are copied onto
the order. Editing an address or repricing a product can't rewrite history.

**Delivery dates are derived, not decorative.** Each product carries a handling
time parsed from its shipping terms. The buy box counts business days forward,
the order takes the slowest line in the basket, your chosen location adds
transit, and the tracking strip interpolates from elapsed time.

**Filters are links.** Every filtered view is a real URL — shareable,
bookmarkable, back-button-correct, and fully functional with JavaScript off.

**Facets are counted before the narrowing filters apply**, so the sidebar keeps
offering options you can still move to instead of collapsing to what you have
already picked.

## Things that broke, and what they cost

Building fast means breaking things. Here are the good ones.

**The deal that had always ended.** Lightning deal windows were anchored to
midnight UTC, so once a product's hour passed it read *"Deal ended"* for the
rest of the day. Record a demo after lunch and the flagship feature looks
dead. Deals now end at the *next* occurrence of their time.

**The coupon that did nothing.** The voucher box has its own `<form>`, and I
rendered it inside the checkout `<form>`. HTML forbids nested forms, so the
browser quietly ate it — "Apply" became a second submit button and full price
got charged. There was a comment in that very file warning about exactly this.

**The checkout that depended on a migration.** An order insert started writing
two columns that only exist after running one SQL file. Every checkout failed,
behind a friendly *"we couldn't place that order."* Taking an order should
never depend on a migration having been applied; it now falls back.

**Five addresses, one street.** Same root cause — the address was saved
*before* the order insert, so every failed attempt left a copy behind. Now the
order is written first, and the address book is only touched if it doesn't
already hold that address.

**262KB of stars.** The rating component drew ten lucide icons, the home page
showed 42 ratings, and the same SVG path got inlined 420 times — half the
document. One `<symbol>` and a `<use>` later: 46KB.

**A thousand image URLs.** Next emits a full `srcset` per image; the defaults
gave eight device widths by eight image widths across ~75 tiles. Narrowing
both lists took 50KB off the page.

The pattern in most of these: an error replaced by a friendly message is a bug
that hides. Several were invisible until the real error got logged.

## What I deliberately did not build

Third-party sellers and seller dashboards · real payment processing · returns
and refunds · Prime Video / Music / subscriptions · wishlists and registries ·
product Q&A · customer-written reviews · a language and currency switcher.

All of them are on the original. None of them is on the path from landing on
the site to placing an order — and that path is the product.

## Run it yourself

```bash
git clone https://github.com/Abdulrehman-codes/8x-amazon-replica
cd 8x-amazon-replica
npm install
cp .env.example .env.local     # then fill in your Supabase values
npm run seed                   # catalog, reviews, vouchers, demo shopper
npm run dev
```

Before the first seed, run these three in the Supabase SQL editor, in order.
All are idempotent:

| File | Creates |
| --- | --- |
| `supabase/schema.sql` | Tables, indexes, RLS policies, the new-user trigger |
| `supabase/search-function.sql` | `search_catalog()` and its supporting indexes |
| `supabase/coupons.sql` | Vouchers, and the order columns that record one |

Then turn **Confirm email** off under *Authentication → Providers → Email*,
unless you enjoy rate limits. If you leave it on, `/auth/confirm` handles the
link — just set your deployment as the **Site URL**, or it will point at
localhost.

### Environment

| Variable | Used by | Set in hosting? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server, under RLS | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `scripts/seed.mjs`, from a terminal | **No** |
| `REVALIDATE_SECRET` | `/api/revalidate`, so a re-seed clears the cache | Yes |
| `SITE_URL` | The seed, to call that endpoint | No |

The first two keep their `NEXT_PUBLIC_` prefix deliberately — the browser
client reads them, and publishing them is safe by design, because access is
decided by row-level security rather than by possession of the key.

The service role key is the one that matters: it bypasses RLS entirely,
nothing under `src/` reads it, and the deployment has no use for it. It must
never get a `NEXT_PUBLIC_` prefix.

## Known limits

Every route is server-rendered per request, because the layout reads cookies
for the cart badge and the greeting — which means `X-Vercel-Cache: MISS` on
everything and a TTFB around half a second. The fix is Partial Prerendering:
serve a static shell from the CDN and stream the personalised bits. It is the
one genuinely architectural thing still on the list.

Search has no autocomplete yet, which is the gap you would feel first at this
catalog size.

## The agent logs

`.agent-logs/` holds every prompt and every response from the build, committed
as it went — 2,400+ lines across three sessions, tool calls included. The
capture hook replays the session transcript from a cursor rather than sampling
it, after the first version quietly kept one sentence out of a 25-minute turn.

## Attribution

Bazaar is an independent portfolio exercise and is not affiliated with any
retailer. Product data and imagery come from [DummyJSON](https://dummyjson.com)
and [Open Library](https://openlibrary.org), whose covers are served by the
Internet Archive. No real payments are processed, and no card number is stored
— only the last four digits, so the order history has something to show.

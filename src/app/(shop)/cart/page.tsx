import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingCart, Check, BadgePercent, Tag } from "lucide-react";
import { CartLineRow } from "@/components/cart-line-row";
import { ProductRail } from "@/components/product-rail";
import { getCart } from "@/lib/cart";
import { getLocation, transitDaysFor } from "@/lib/location";
import { getAppliedCoupon } from "@/lib/coupons";
import { getHomeData } from "@/lib/queries";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Shopping cart" };

export default async function CartPage() {
  const [cart, location] = await Promise.all([getCart(), getLocation()]);
  const extraDays = transitDaysFor(location);
  const couponOutcome = await getAppliedCoupon(cart.subtotalCents);

  if (cart.active.length === 0 && cart.saved.length === 0) {
    return <EmptyCart />;
  }

  // What the list prices would have cost, so the discount is stated as money
  // rather than left for the shopper to work out per line.
  const savedCents = cart.active.reduce(
    (sum, l) =>
      sum +
      Math.max(0, l.product.list_price_cents - l.product.price_cents) * l.qty,
    0,
  );

  const qualifies = cart.subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents;

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card bg-surface p-5 shadow-sm">
          <h1 className="text-2xl font-semibold">Shopping cart</h1>
          <p className="mt-1 border-b border-border pb-3 text-right text-sm text-fg-muted">
            Price
          </p>

          {cart.active.length === 0 ? (
            <p className="py-8 text-sm text-fg-muted">
              Your cart is empty, but you have items saved for later below.
            </p>
          ) : (
            <ul>
              {cart.active.map((line) => (
                <CartLineRow key={line.id} line={line} extraDays={extraDays} />
              ))}
            </ul>
          )}

          <p className="border-t border-border pt-4 text-right text-base">
            Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}):{" "}
            <span className="font-bold">
              {formatPrice(cart.subtotalCents)}
            </span>
          </p>
        </div>

        {/* Summary rail */}
        <aside className="h-fit space-y-3 lg:sticky lg:top-32">
          <div className="rounded-card bg-surface p-4 shadow-sm">
            {qualifies ? (
              <p className="flex gap-2 text-sm text-success">
                <Check size={16} className="mt-0.5 shrink-0" strokeWidth={3} />
                <span>
                  Your order qualifies for{" "}
                  <span className="font-semibold">FREE delivery</span>.
                </span>
              </p>
            ) : (
              <div>
                <p className="text-sm text-fg-muted">
                  Add{" "}
                  <span className="font-semibold text-fg">
                    {formatPrice(remaining)}
                  </span>{" "}
                  more for <span className="font-semibold">FREE delivery</span>.
                </p>
                {/* Progress, because a number alone does not show how close
                    the basket already is. */}
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-canvas">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#f5a524,#067d62)] transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((cart.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100))}%`,
                    }}
                  />
                </span>
              </div>
            )}

            <p className="mt-3 text-lg">
              Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}):{" "}
              <span className="font-bold">
                {formatPrice(cart.subtotalCents)}
              </span>
            </p>

            {couponOutcome?.ok && (
              <p className="mt-1 flex items-center gap-1.5 rounded bg-accent-soft px-2 py-1 text-sm font-semibold text-fg">
                <Tag size={14} className="text-accent" />
                {couponOutcome.coupon.code} applied
                {couponOutcome.freeShipping
                  ? " — free delivery"
                  : ` — ${formatPrice(couponOutcome.discountCents)} off at checkout`}
              </p>
            )}

            {savedCents > 0 && (
              <p className="mt-1 flex items-center gap-1.5 rounded bg-success/10 px-2 py-1 text-sm font-semibold text-success">
                <BadgePercent size={14} />
                You saved {formatPrice(savedCents)} today
              </p>
            )}

            <Link
              href="/checkout"
              aria-disabled={cart.active.length === 0}
              className={`mt-3 block rounded-full py-2.5 text-center text-sm font-semibold transition ${
                cart.active.length === 0
                  ? "pointer-events-none bg-canvas text-fg-subtle"
                  : "bg-accent text-ink hover:bg-accent-hover"
              }`}
            >
              Proceed to checkout
            </Link>
          </div>
        </aside>
      </div>

      {cart.saved.length > 0 && (
        <div className="mt-4 rounded-card bg-surface p-5 shadow-sm">
          <h2 className="text-xl font-semibold">
            Saved for later ({cart.saved.length})
          </h2>
          <ul className="mt-2">
            {cart.saved.map((line) => (
              <CartLineRow key={line.id} line={line} saved />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <Recommendations />
      </div>
    </div>
  );
}

async function Recommendations() {
  const { topRated } = await getHomeData();
  return (
    <ProductRail
      title="Customers who shopped here also viewed"
      href="/s?sort=rating"
      products={topRated}
    />
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-10">
      <div className="rounded-card bg-surface px-6 py-14 text-center shadow-sm">
        <ShoppingCart
          size={48}
          strokeWidth={1.25}
          className="mx-auto text-fg-subtle"
        />
        <h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
          Nothing in here yet. Today&apos;s deals are a reasonable place to
          start.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/s?deals=1"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
          >
            Shop today&apos;s deals
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border-strong px-6 py-2.5 text-sm font-semibold transition hover:bg-canvas"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

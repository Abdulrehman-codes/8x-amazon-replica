import Link from "next/link";
import type { Metadata } from "next";
import { Check, Scissors, Tag } from "lucide-react";
import { listCoupons, getAppliedCode } from "@/lib/coupons";
import { clipCoupon, removeCoupon } from "@/lib/actions/coupons";
import { getCart } from "@/lib/cart";
import { evaluateCoupon } from "@/lib/coupon-math";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Vouchers & coupons",
  description: "Every promotion currently running at Bazaar.",
};

export default async function CouponsPage() {
  const [coupons, applied, cart] = await Promise.all([
    listCoupons(),
    getAppliedCode(),
    getCart(),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-6">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Tag size={22} className="text-accent" />
          Vouchers &amp; coupons
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Clip one and it is applied at checkout. One voucher per order — the
          basket keeps whichever you clipped last.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => {
          const isApplied = applied === coupon.code;
          // Priced against the basket as it stands, so the card can say
          // what is actually stopping it from being used.
          const outcome = evaluateCoupon(coupon, cart.subtotalCents);

          return (
            <li
              key={coupon.code}
              className={`relative overflow-hidden rounded-card border bg-surface p-5 transition ${
                isApplied ? "border-success shadow-md" : "border-border hover:shadow-md"
              }`}
            >
              {/* Ticket notches */}
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-canvas" />
              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-canvas" />

              <p className="font-mono text-lg font-bold tracking-wider text-fg">
                {coupon.code}
              </p>
              <p className="mt-1 text-sm font-semibold text-accent">
                {coupon.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {coupon.description}
              </p>

              {coupon.min_spend_cents > 0 && (
                <p className="mt-2 text-xs text-fg-subtle">
                  Minimum spend {formatPrice(coupon.min_spend_cents)}
                </p>
              )}

              <div className="mt-4 border-t border-dashed border-border pt-3">
                {isApplied ? (
                  <form action={removeCoupon}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-success py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Check size={15} strokeWidth={3} />
                      Clipped — remove
                    </button>
                  </form>
                ) : (
                  <form action={clipCoupon}>
                    <input type="hidden" name="code" value={coupon.code} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2 text-sm font-semibold text-ink transition hover:bg-accent-hover active:scale-[0.98]"
                    >
                      <Scissors size={15} />
                      Clip this voucher
                    </button>
                  </form>
                )}

                {!outcome.ok && !isApplied && (
                  <p className="mt-2 text-center text-xs text-fg-subtle">
                    {outcome.reason}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {coupons.length === 0 && (
        <p className="rounded-card bg-surface px-6 py-12 text-center text-sm text-fg-muted shadow-sm">
          No promotions are running right now. Today&apos;s deals are still
          worth a look.
        </p>
      )}

      <div className="mt-6 rounded-card bg-surface p-5 shadow-sm">
        <h2 className="font-bold">Always on</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-fg-muted">
          <li>Free standard delivery on orders over $35.</li>
          <li>Lightning deals refresh through the day, with a live countdown.</li>
          <li>30-day free returns on almost everything.</li>
        </ul>
        <Link
          href="/s?deals=1&sort=featured"
          className="mt-3 inline-block text-sm text-link hover:text-link-hover"
        >
          Browse today&apos;s deals →
        </Link>
      </div>
    </div>
  );
}

/**
 * Coupon shape and pricing.
 *
 * Deliberately free of `next/headers` and of any database access, because the
 * checkout summary evaluates coupons in the browser as the delivery speed
 * changes while `placeOrder` evaluates the same way on the server. One
 * implementation means what is shown and what is charged cannot disagree.
 */
import { shippingCentsFor } from "./delivery";
import type { DeliverySpeed } from "./types";

export type Coupon = {
  code: string;
  label: string;
  description: string;
  kind: "percent" | "fixed" | "shipping";
  value: number;
  min_spend_cents: number;
  max_discount_cents: number | null;
  department_slug: string | null;
  expires_at: string | null;
  active: boolean;
  sort: number;
};

export type CouponOutcome =
  | { ok: true; coupon: Coupon; discountCents: number; freeShipping: boolean }
  | { ok: false; reason: string };

/**
 * Decides what a coupon is worth against a given basket.
 *
 * Single source of truth: the checkout summary, the cart and `placeOrder` all
 * call this, so what a shopper is shown and what they are charged cannot
 * disagree. Nothing here trusts a number sent by the client.
 */
export function evaluateCoupon(
  coupon: Coupon | null,
  subtotalCents: number,
  speed: DeliverySpeed = "standard",
): CouponOutcome {
  if (!coupon || !coupon.active) {
    return { ok: false, reason: "That code isn't recognised." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "That code has expired." };
  }

  if (subtotalCents < coupon.min_spend_cents) {
    const short = (coupon.min_spend_cents - subtotalCents) / 100;
    return {
      ok: false,
      reason: `Spend $${short.toFixed(2)} more to use ${coupon.code}.`,
    };
  }

  if (coupon.kind === "shipping") {
    const shipping = shippingCentsFor(speed, subtotalCents);
    if (shipping === 0) {
      return {
        ok: false,
        reason: "This order already has free delivery.",
      };
    }
    return { ok: true, coupon, discountCents: 0, freeShipping: true };
  }

  let discount =
    coupon.kind === "percent"
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.value;

  if (coupon.max_discount_cents != null) {
    discount = Math.min(discount, coupon.max_discount_cents);
  }
  // Never let a voucher pay the customer.
  discount = Math.max(0, Math.min(discount, subtotalCents));

  if (discount === 0) {
    return { ok: false, reason: "That code is worth nothing on this basket." };
  }

  return { ok: true, coupon, discountCents: discount, freeShipping: false };
}


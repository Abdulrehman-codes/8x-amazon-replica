"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCart } from "../cart";
import { COUPON_COOKIE, getCoupon } from "../coupons";
import { evaluateCoupon } from "../coupon-math";

export type CouponState = { error?: string; ok?: string };

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
  secure: process.env.NODE_ENV === "production",
};

export async function applyCoupon(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const raw = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!raw) return { error: "Enter a code." };
  if (!/^[A-Z0-9]{3,24}$/.test(raw)) {
    return { error: "That doesn't look like a valid code." };
  }

  const [coupon, cart] = await Promise.all([getCoupon(raw), getCart()]);
  const outcome = evaluateCoupon(coupon, cart.subtotalCents);

  // Refuse to store a code that would not apply, so the summary can never
  // show an applied voucher that is quietly worth nothing.
  if (!outcome.ok) return { error: outcome.reason };

  const store = await cookies();
  store.set(COUPON_COOKIE, raw, COOKIE_OPTIONS);

  revalidatePath("/", "layout");
  return { ok: `${raw} applied.` };
}

/** Used by the vouchers page, where the code is known rather than typed. */
export async function clipCoupon(formData: FormData) {
  const raw = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,24}$/.test(raw)) return;

  const store = await cookies();
  store.set(COUPON_COOKIE, raw, COOKIE_OPTIONS);
  revalidatePath("/", "layout");
}

export async function removeCoupon() {
  const store = await cookies();
  store.delete(COUPON_COOKIE);
  revalidatePath("/", "layout");
}

import { cookies } from "next/headers";
import { supabasePublic } from "./supabase/public";
import { evaluateCoupon, type Coupon, type CouponOutcome } from "./coupon-math";
import type { DeliverySpeed } from "./types";

export const COUPON_COOKIE = "bazaar_coupon";

export type { Coupon, CouponOutcome };
export { evaluateCoupon };

export async function listCoupons(): Promise<Coupon[]> {
  const { data } = await supabasePublic
    .from("coupons")
    .select("*")
    .eq("active", true)
    .order("sort");
  return (data ?? []) as Coupon[];
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const { data } = await supabasePublic
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .maybeSingle();
  return (data as Coupon | null) ?? null;
}

/** The code the visitor has applied, if any. */
export async function getAppliedCode(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COUPON_COOKIE)?.value?.trim().toUpperCase();
  return raw && /^[A-Z0-9]{3,24}$/.test(raw) ? raw : null;
}


/** Resolves the applied cookie into a priced outcome, or null if none. */
export async function getAppliedCoupon(
  subtotalCents: number,
  speed: DeliverySpeed = "standard",
): Promise<CouponOutcome | null> {
  const code = await getAppliedCode();
  if (!code) return null;
  const coupon = await getCoupon(code);
  return evaluateCoupon(coupon, subtotalCents, speed);
}

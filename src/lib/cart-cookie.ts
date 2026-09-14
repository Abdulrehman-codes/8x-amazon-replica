/**
 * The cart cookie's shape and parsing — deliberately free of `next/headers`
 * so client components can import the quantity cap and the line type without
 * dragging server-only APIs into the browser bundle.
 *
 * Reading and writing the actual cookie lives in `cart.ts` (server) and
 * `actions/cart.ts` (server actions).
 */

export const CART_COOKIE = "bazaar_cart";
export const MAX_QTY = 30;

export type CartCookieLine = {
  /** Product id. */
  i: string;
  /** Quantity. */
  q: number;
  /** Saved for later rather than in the active cart. */
  s?: 1;
};

/** Never throws: a malformed or tampered cookie degrades to an empty cart. */
export function parseCart(raw: string | undefined): CartCookieLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartCookieLine =>
          typeof l?.i === "string" && typeof l?.q === "number",
      )
      .map((l) => ({
        i: l.i,
        q: Math.max(1, Math.min(MAX_QTY, Math.floor(l.q))),
        ...(l.s ? { s: 1 as const } : {}),
      }));
  } catch {
    return [];
  }
}

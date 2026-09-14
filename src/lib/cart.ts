import { cookies } from "next/headers";
import { getProductsByIds } from "./queries";
import { CART_COOKIE, parseCart, type CartCookieLine } from "./cart-cookie";
import type { CartLine, Product } from "./types";

export async function readCart(): Promise<CartCookieLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

export type HydratedCart = {
  active: CartLine[];
  saved: CartLine[];
  subtotalCents: number;
  itemCount: number;
};

/** Turns the cookie's id/qty pairs into full product rows for rendering. */
export async function getCart(): Promise<HydratedCart> {
  const lines = await readCart();
  if (!lines.length) {
    return { active: [], saved: [], subtotalCents: 0, itemCount: 0 };
  }

  const products = await getProductsByIds(lines.map((l) => l.i));
  const byId = new Map<string, Product>(products.map((p) => [p.id, p]));

  const active: CartLine[] = [];
  const saved: CartLine[] = [];

  for (const line of lines) {
    const product = byId.get(line.i);
    // A product can vanish from the catalog between adding and viewing.
    if (!product) continue;
    const entry: CartLine = {
      id: product.id,
      qty: line.q,
      saved_for_later: Boolean(line.s),
      product,
    };
    (line.s ? saved : active).push(entry);
  }

  return {
    active,
    saved,
    subtotalCents: active.reduce(
      (sum, l) => sum + l.product.price_cents * l.qty,
      0,
    ),
    itemCount: active.reduce((sum, l) => sum + l.qty, 0),
  };
}

/** Item count for the header badge, without hydrating any product rows. */
export async function getCartCount() {
  const lines = await readCart();
  return lines.reduce((sum, l) => (l.s ? sum : sum + l.q), 0);
}

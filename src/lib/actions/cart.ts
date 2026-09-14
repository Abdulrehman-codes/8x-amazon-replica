"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CART_COOKIE, MAX_QTY, parseCart, type CartCookieLine } from "../cart";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};

async function mutate(fn: (lines: CartCookieLine[]) => CartCookieLine[]) {
  const store = await cookies();
  const next = fn(parseCart(store.get(CART_COOKIE)?.value));
  store.set(CART_COOKIE, JSON.stringify(next), COOKIE_OPTIONS);

  // The header badge is rendered on every route, so the whole tree revalidates.
  revalidatePath("/", "layout");
}

export async function addToCart(productId: string, qty = 1) {
  await mutate((lines) => {
    const existing = lines.find((l) => l.i === productId);
    if (existing) {
      existing.q = Math.min(MAX_QTY, existing.q + qty);
      delete existing.s;
      return lines;
    }
    return [...lines, { i: productId, q: Math.min(MAX_QTY, Math.max(1, qty)) }];
  });
}

export async function setQty(productId: string, qty: number) {
  await mutate((lines) => {
    if (qty <= 0) return lines.filter((l) => l.i !== productId);
    return lines.map((l) =>
      l.i === productId ? { ...l, q: Math.min(MAX_QTY, qty) } : l,
    );
  });
}

export async function removeFromCart(productId: string) {
  await mutate((lines) => lines.filter((l) => l.i !== productId));
}

export async function saveForLater(productId: string) {
  await mutate((lines) =>
    lines.map((l) => (l.i === productId ? { ...l, s: 1 as const } : l)),
  );
}

export async function moveToCart(productId: string) {
  await mutate((lines) =>
    lines.map((l) => {
      if (l.i !== productId) return l;
      const { s: _saved, ...rest } = l;
      return rest;
    }),
  );
}

export async function clearCart() {
  await mutate(() => []);
}

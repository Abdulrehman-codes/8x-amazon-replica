import type { Product } from "./types";

/**
 * Deal metadata derived from the catalog rather than stored.
 *
 * The discount is real — it is the gap between list price and price. The
 * urgency around it (when the deal ends, how much stock has gone) is derived
 * deterministically from the product slug and the current day, so it is stable
 * for everyone looking at the same product on the same day and does not need a
 * scheduler to maintain.
 */

function hashUnit(str: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function discountPercent(product: Product) {
  if (product.list_price_cents <= product.price_cents) return 0;
  return Math.round((1 - product.price_cents / product.list_price_cents) * 100);
}

export function savingsCents(product: Product) {
  return Math.max(0, product.list_price_cents - product.price_cents);
}

/** Anything at 25% or more is promoted as a lightning deal. */
export const LIGHTNING_THRESHOLD = 25;

export function isLightningDeal(product: Product) {
  return discountPercent(product) >= LIGHTNING_THRESHOLD;
}

/**
 * When this product's deal expires.
 *
 * Each product owns a fixed hour and minute of the day, derived from its slug.
 * The deal ends at the next occurrence of that time, so the countdown is
 * always in the future and always under 24 hours, and every visitor sees the
 * same clock without anything needing to be scheduled.
 *
 * An earlier version anchored the window to midnight, which meant a deal read
 * "ended" for the rest of the day once its hour had passed.
 */
export function dealEndsAt(product: Product, now = new Date()): Date {
  const hour = Math.floor(hashUnit(product.slug, 9) * 24);
  const minute = Math.floor(hashUnit(product.slug, 23) * 60);

  const ends = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hour,
      minute,
      0,
      0,
    ),
  );
  if (ends.getTime() <= now.getTime()) {
    ends.setUTCDate(ends.getUTCDate() + 1);
  }
  return ends;
}

/**
 * Portion of the deal's allocation already taken.
 *
 * Tied to how close the deal is to ending, so the bar and the clock tell the
 * same story rather than drifting apart.
 */
export function claimedPercent(product: Product, now = new Date()) {
  const ends = dealEndsAt(product, now).getTime();
  const remainingMs = Math.max(0, ends - now.getTime());
  const spent = 1 - remainingMs / 86_400_000;

  const floor = 18 + hashUnit(product.slug, 17) * 22; // 18-40
  return Math.min(97, Math.round(floor + spent * 55));
}

export type PromoMessage = { text: string; href: string };

export const PROMOS: PromoMessage[] = [
  { text: "Free delivery on orders over $35", href: "/s?deals=1" },
  { text: "Lightning deals — a new window every day", href: "/s?deals=1&sort=featured" },
  { text: "2,800+ products across nine departments", href: "/s" },
  { text: "Express delivery in two days on eligible items", href: "/s?prime=1" },
  { text: "30-day free returns on almost everything", href: "/s" },
];

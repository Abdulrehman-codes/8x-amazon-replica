import type { DeliverySpeed } from "./types";

/** Shipping cost and the days shaved off the base handling time. */
export const DELIVERY_OPTIONS: {
  key: DeliverySpeed;
  label: string;
  note: string;
  cents: number;
  maxDays: number;
}[] = [
  {
    key: "standard",
    label: "Standard delivery",
    note: "Free on orders over $35",
    cents: 499,
    maxDays: 99,
  },
  {
    key: "express",
    label: "Express delivery",
    note: "Cuts the wait roughly in half",
    cents: 899,
    maxDays: 3,
  },
  {
    key: "sameday",
    label: "Same-day delivery",
    note: "Order before 2pm, arrives tonight",
    cents: 1299,
    maxDays: 0,
  },
];

export const FREE_SHIPPING_THRESHOLD_CENTS = 3500;
export const TAX_RATE = 0.0825;

/**
 * Arrival date for a product, counting business days only — a Friday order
 * with two days of handling arrives Tuesday, not Sunday.
 */
export function deliveryDate(shipDays: number, speed: DeliverySpeed = "standard", from = new Date()) {
  const option = DELIVERY_OPTIONS.find((o) => o.key === speed) ?? DELIVERY_OPTIONS[0];
  const days = Math.max(0, Math.min(shipDays, option.maxDays));

  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}

/** "Tomorrow, Sep 15" / "Tue, Sep 22" — the phrasing Amazon's buy box uses. */
export function formatDeliveryDate(date: Date, from = new Date()) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - start.getTime()) / 86_400_000);

  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays <= 0) return `Today, ${label}`;
  if (diffDays === 1) return `Tomorrow, ${label}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${label}`;
}

export function shippingCentsFor(speed: DeliverySpeed, subtotalCents: number) {
  const option = DELIVERY_OPTIONS.find((o) => o.key === speed) ?? DELIVERY_OPTIONS[0];
  if (speed === "standard" && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return option.cents;
}

export function taxCentsFor(subtotalCents: number) {
  return Math.round(subtotalCents * TAX_RATE);
}

/** Orders progress through fulfilment as time passes since they were placed. */
export function statusForOrder(placedAt: string, etaDate: string) {
  const placed = new Date(placedAt).getTime();
  const eta = new Date(etaDate).getTime();
  const now = Date.now();

  if (now >= eta) return "delivered" as const;
  const elapsed = (now - placed) / Math.max(1, eta - placed);
  if (elapsed > 0.8) return "out_for_delivery" as const;
  if (elapsed > 0.35) return "shipped" as const;
  if (elapsed > 0.1) return "preparing" as const;
  return "placed" as const;
}

export const STATUS_LABELS: Record<string, string> = {
  placed: "Order placed",
  preparing: "Preparing for dispatch",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

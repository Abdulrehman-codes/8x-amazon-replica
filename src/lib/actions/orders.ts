"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { getCart } from "../cart";
import { getLocation, transitDaysFor } from "../location";
import { getAppliedCode, getCoupon } from "../coupons";
import { evaluateCoupon } from "../coupon-math";
import { CART_COOKIE } from "../cart-cookie";
import {
  deliveryDate,
  shippingCentsFor,
  taxCentsFor,
} from "../delivery";
import type { DeliverySpeed } from "../types";

export type CheckoutState = { error?: string };

const addressSchema = z.object({
  full_name: z.string().min(2, "Enter the recipient's full name."),
  line1: z.string().min(3, "Enter a street address."),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, "Enter a city."),
  state: z.string().min(2, "Enter a state."),
  postal_code: z.string().min(3, "Enter a postal code."),
  phone: z.string().optional().nullable(),
});

const checkoutSchema = z.object({
  addressId: z.string().uuid().optional(),
  address: addressSchema.optional(),
  speed: z.enum(["standard", "express", "sameday"]),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Enter a valid card number.")),
  cardName: z.string().min(2, "Enter the name on the card."),
  cardExpiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, "Use MM/YY for the expiry date."),
  cardCvc: z.string().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit security code."),
});

/** Postgres 42703, or PostgREST's schema-cache equivalent. */
function isMissingColumn(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .* does not exist|could not find the .* column/i.test(
      error.message ?? "",
    )
  );
}

function brandFor(cardNumber: string) {
  if (cardNumber.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(cardNumber)) return "Mastercard";
  if (/^3[47]/.test(cardNumber)) return "American Express";
  if (cardNumber.startsWith("6")) return "Discover";
  return "Card";
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=%2Fcheckout");

  const rawAddress = formData.get("address");
  const parsed = checkoutSchema.safeParse({
    addressId: (formData.get("addressId") as string) || undefined,
    address: rawAddress ? JSON.parse(rawAddress as string) : undefined,
    speed: formData.get("speed"),
    cardNumber: formData.get("cardNumber"),
    cardName: formData.get("cardName"),
    cardExpiry: formData.get("cardExpiry"),
    cardCvc: formData.get("cardCvc"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const cart = await getCart();
  if (cart.active.length === 0) {
    return { error: "Your cart is empty." };
  }

  // Totals are recomputed here from catalog prices. Anything the client sent
  // about money is ignored on purpose.
  const subtotal = cart.active.reduce(
    (sum, line) => sum + line.product.price_cents * line.qty,
    0,
  );
  const speed = parsed.data.speed as DeliverySpeed;

  // The coupon is priced here from the stored code, never from the form. A
  // code that has since expired or no longer clears its minimum simply stops
  // applying rather than failing the order.
  const code = await getAppliedCode();
  const outcome = code
    ? evaluateCoupon(await getCoupon(code), subtotal, speed)
    : null;
  const discount = outcome?.ok ? outcome.discountCents : 0;
  const couponCode = outcome?.ok ? outcome.coupon.code : null;

  const baseShipping = shippingCentsFor(speed, subtotal);
  const shipping = outcome?.ok && outcome.freeShipping ? 0 : baseShipping;

  // Tax follows the discounted subtotal, which is how a real basket behaves.
  const tax = taxCentsFor(Math.max(0, subtotal - discount));
  const total = Math.max(0, subtotal - discount) + shipping + tax;

  // Resolve where this is going. A typed address is NOT saved yet: the order
  // snapshots its own copy, so writing to the address book before the order
  // exists is what left a duplicate behind on every failed attempt.
  let shipTo: z.infer<typeof addressSchema> & { id?: string; country?: string };
  let addressToRemember: z.infer<typeof addressSchema> | null = null;

  if (parsed.data.addressId) {
    const { data: existing } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", parsed.data.addressId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) return { error: "That delivery address is no longer available." };
    shipTo = existing;
  } else if (parsed.data.address) {
    shipTo = { ...parsed.data.address, country: "United States" };
    addressToRemember = parsed.data.address;
  } else {
    return { error: "Choose a delivery address." };
  }

  // The order arrives when its slowest line arrives.
  const location = await getLocation();
  const slowest =
    Math.max(...cart.active.map((line) => line.product.ship_days)) +
    transitDaysFor(location);
  const eta = deliveryDate(slowest, speed);

  const cardNumber = parsed.data.cardNumber;

  const baseRow = {
    user_id: user.id,
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    tax_cents: tax,
    total_cents: total,
    ship_to: shipTo,
    payment_last4: cardNumber.slice(-4),
    payment_brand: brandFor(cardNumber),
    delivery_speed: speed,
    eta_date: eta.toISOString().slice(0, 10),
  };

  let { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ ...baseRow, discount_cents: discount, coupon_code: couponCode })
    .select()
    .single();

  // The voucher columns arrive with supabase/coupons.sql. A deployment that
  // has not run it yet must still be able to take an order, so fall back to
  // the columns that have always existed rather than failing the purchase.
  if (orderError && isMissingColumn(orderError)) {
    console.warn(
      "orders: voucher columns absent, placing without discount. Run supabase/coupons.sql.",
    );
    ({ data: order, error: orderError } = await supabase
      .from("orders")
      .insert(baseRow)
      .select()
      .single());
  }

  if (orderError || !order) {
    // Swallowing the cause here is what made this hard to diagnose once.
    console.error("orders: insert failed", orderError);
    return {
      error:
        "We couldn't place that order. Nothing has been charged — please try again.",
    };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    cart.active.map((line) => ({
      order_id: order.id,
      product_id: line.product.id,
      title: line.product.title,
      slug: line.product.slug,
      image_url: line.product.images[0] ?? null,
      unit_price_cents: line.product.price_cents,
      qty: line.qty,
    })),
  );

  if (itemsError) {
    // Without a transaction an empty order is worse than none: roll it back.
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "We couldn't place that order. Please try again." };
  }

  // Now that the order exists, remember the address — but only if the book
  // does not already hold it. Checking out three times from one address
  // should not leave three copies of it.
  if (addressToRemember) {
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .ilike("line1", addressToRemember.line1)
      .ilike("city", addressToRemember.city)
      .ilike("postal_code", addressToRemember.postal_code)
      .maybeSingle();

    if (!existing) {
      const { count } = await supabase
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      await supabase.from("addresses").insert({
        ...addressToRemember,
        user_id: user.id,
        country: "United States",
        is_default: (count ?? 0) === 0,
      });
    }
  }

  // Keep anything saved for later; clear only what was bought.
  const store = await cookies();
  const remaining = cart.saved.map((line) => ({
    i: line.product.id,
    q: line.qty,
    s: 1 as const,
  }));
  store.set(CART_COOKIE, JSON.stringify(remaining), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}?placed=1`);
}

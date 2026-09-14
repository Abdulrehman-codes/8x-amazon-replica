"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { getCart, CART_COOKIE } from "../cart";
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
  const shipping = shippingCentsFor(speed, subtotal);
  const tax = taxCentsFor(subtotal);
  const total = subtotal + shipping + tax;

  // Resolve the destination: an existing address the caller owns, or a new one.
  let shipTo: z.infer<typeof addressSchema> & { id?: string };

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
    const { data: created, error: addressError } = await supabase
      .from("addresses")
      .insert({ ...parsed.data.address, user_id: user.id })
      .select()
      .single();
    if (addressError || !created) {
      return { error: "We couldn't save that delivery address." };
    }
    shipTo = created;
  } else {
    return { error: "Choose a delivery address." };
  }

  // The order arrives when its slowest line arrives.
  const slowest = Math.max(...cart.active.map((line) => line.product.ship_days));
  const eta = deliveryDate(slowest, speed);

  const cardNumber = parsed.data.cardNumber;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
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
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: "We couldn't place that order. Please try again." };
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

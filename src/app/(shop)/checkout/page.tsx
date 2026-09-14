import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getCart } from "@/lib/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Checkout is the first and only point that requires an account.
  if (!user) redirect("/signin?next=%2Fcheckout");

  const cart = await getCart();
  if (cart.active.length === 0) redirect("/cart");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  return (
    <div className="mx-auto max-w-[1300px] px-3 py-5">
      <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>
      <CheckoutForm
        lines={cart.active}
        addresses={(addresses ?? []) as Address[]}
        defaultName={defaultName}
      />
    </div>
  );
}

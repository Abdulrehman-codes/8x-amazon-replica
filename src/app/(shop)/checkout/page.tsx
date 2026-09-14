import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { signOutAction } from "@/lib/actions/auth";
import { getCart } from "@/lib/cart";
import { getLocation, transitDaysFor } from "@/lib/location";
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
  const location = await getLocation();
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
      <h1 className="mb-3 text-2xl font-semibold">Checkout</h1>

      {/* Which account is buying must be unmissable here. Ordering under the
          wrong session is a mistake you only discover after paying. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface px-4 py-2.5 text-sm">
        <span className="text-fg-muted">
          Ordering as{" "}
          <span className="font-semibold text-fg">{user.email}</span>
        </span>
        <form action={signOutAction}>
          <button type="submit" className="text-link hover:text-link-hover">
            Not you? Sign out
          </button>
        </form>
      </div>
      <CheckoutForm
        lines={cart.active}
        addresses={(addresses ?? []) as Address[]}
        defaultName={defaultName}
        extraDays={transitDaysFor(location)}
      />
    </div>
  );
}

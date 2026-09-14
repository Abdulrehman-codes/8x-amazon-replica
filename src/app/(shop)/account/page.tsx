import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Package, MapPin, ShoppingCart, LogOut } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=%2Faccount");

  const [{ data: addresses }, { count: orderCount }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0];

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-6">
      <h1 className="text-2xl font-semibold">Your account</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Signed in as <span className="font-medium text-fg">{user.email}</span>
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          href="/orders"
          icon={<Package size={22} />}
          title="Your orders"
          body={`${orderCount ?? 0} order${orderCount === 1 ? "" : "s"} — track, review or buy again`}
        />
        <Card
          href="/cart"
          icon={<ShoppingCart size={22} />}
          title="Your cart"
          body="Items you've added, and anything saved for later"
        />
        <Card
          href="/s?sort=rating"
          icon={<MapPin size={22} />}
          title="Keep shopping"
          body="Browse the highest rated products this week"
        />
      </div>

      <section className="mt-6 rounded-card bg-surface p-5 shadow-sm">
        <h2 className="font-bold">Your addresses</h2>
        {addresses?.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {(addresses as Address[]).map((address) => (
              <li
                key={address.id}
                className="rounded border border-border p-4 text-sm leading-relaxed"
              >
                <span className="block font-semibold">{address.full_name}</span>
                <span className="text-fg-muted">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postal_code}
                  <br />
                  {address.country}
                </span>
                {address.is_default && (
                  <span className="mt-2 inline-block rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-fg">
                    Default
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">
            No saved addresses yet. You can add one during checkout.
          </p>
        )}
      </section>

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition hover:bg-surface"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </form>
    </div>
  );
}

function Card({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-card bg-surface p-4 shadow-sm transition hover:shadow-md"
    >
      <span className="mt-0.5 shrink-0 text-fg-subtle">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-fg-muted">{body}</span>
      </span>
    </Link>
  );
}

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { statusForOrder, STATUS_LABELS } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=%2Forders");

  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false });

  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-5">
      <h1 className="mb-4 text-2xl font-semibold">Your orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-card bg-surface px-6 py-14 text-center shadow-sm">
          <Package size={44} strokeWidth={1.25} className="mx-auto text-fg-subtle" />
          <h2 className="mt-4 text-lg font-semibold">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
            When you place an order it shows up here, with tracking that moves
            as the delivery date approaches.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const status = statusForOrder(order.placed_at, order.eta_date);
            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-card border border-border bg-surface shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-canvas px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-6">
                    <span>
                      <span className="block uppercase tracking-wide text-fg-subtle">
                        Order placed
                      </span>
                      <span className="font-medium text-fg">
                        {new Date(order.placed_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                    <span>
                      <span className="block uppercase tracking-wide text-fg-subtle">
                        Total
                      </span>
                      <span className="font-medium text-fg">
                        {formatPrice(order.total_cents)}
                      </span>
                    </span>
                    <span>
                      <span className="block uppercase tracking-wide text-fg-subtle">
                        Ship to
                      </span>
                      <span className="font-medium text-fg">
                        {order.ship_to?.full_name}
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block uppercase tracking-wide text-fg-subtle">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-link hover:text-link-hover"
                    >
                      View order details
                    </Link>
                  </div>
                </div>

                <div className="px-4 py-4">
                  <p className="mb-3 text-base font-bold">
                    {STATUS_LABELS[status]}
                    {status !== "delivered" && (
                      <span className="ml-2 text-sm font-normal text-fg-muted">
                        Arriving{" "}
                        {new Date(order.eta_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </p>

                  <ul className="space-y-3">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex gap-4">
                        <Link
                          href={`/dp/${item.slug}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-canvas"
                        >
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-contain"
                            />
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dp/${item.slug}`}
                            className="line-clamp-2-safe text-sm text-link hover:text-link-hover"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-fg-muted">
                            Qty {item.qty} ·{" "}
                            {formatPrice(item.unit_price_cents)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

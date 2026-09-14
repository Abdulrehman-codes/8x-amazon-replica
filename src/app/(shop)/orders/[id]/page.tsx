import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { TrackingStrip } from "@/components/tracking-strip";
import { OrderCelebration } from "@/components/order-celebration";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { statusForOrder, STATUS_LABELS } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/orders/${id}`)}`);

  // RLS already scopes this to the caller; the user_id filter documents intent.
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;

  const status = statusForOrder(order.placed_at, order.eta_date);
  const justPlaced = query.placed === "1";
  const etaLabel = new Date(order.eta_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-3 py-5">
      {justPlaced && <OrderCelebration />}

      {justPlaced && (
        <div className="animate-slide-up flex items-start gap-3 rounded-card border border-success/30 bg-success/5 p-5">
          <CheckCircle2 size={26} className="animate-pop shrink-0 text-success" />
          <div>
            <h1 className="text-xl font-bold text-success">
              Order placed — thank you
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              A confirmation would normally reach your inbox. Your delivery is
              estimated for{" "}
              <span className="font-semibold text-fg">{etaLabel}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-card bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-sm text-fg-muted">
              Placed{" "}
              {new Date(order.placed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Link href="/orders" className="text-sm text-link hover:text-link-hover">
            All orders
          </Link>
        </div>

        <p className="mt-4 text-base font-bold">
          {STATUS_LABELS[status]}
          {status !== "delivered" && (
            <span className="ml-2 text-sm font-normal text-fg-muted">
              Arriving {etaLabel}
            </span>
          )}
        </p>

        <div className="mt-5">
          <TrackingStrip status={status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card bg-surface p-5 shadow-sm">
          <h2 className="mb-3 font-bold">
            {order.order_items.length} item
            {order.order_items.length === 1 ? "" : "s"}
          </h2>
          <ul className="space-y-4">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                <Link
                  href={`/dp/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-canvas"
                >
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dp/${item.slug}`}
                    className="text-sm font-medium hover:text-link-hover"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-fg-muted">
                    Quantity: {item.qty}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPrice(item.unit_price_cents * item.qty)}
                  </p>
                  <Link
                    href={`/dp/${item.slug}`}
                    className="mt-2 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-accent-hover"
                  >
                    Buy it again
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit space-y-4">
          <div className="rounded-card bg-surface p-5 shadow-sm">
            <h2 className="mb-2 font-bold">Order summary</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label="Items" value={formatPrice(order.subtotal_cents)} />
              <Row
                label="Delivery"
                value={
                  order.shipping_cents === 0
                    ? "FREE"
                    : formatPrice(order.shipping_cents)
                }
              />
              <Row label="Tax" value={formatPrice(order.tax_cents)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total_cents)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card bg-surface p-5 shadow-sm">
            <h2 className="mb-2 font-bold">Delivering to</h2>
            <address className="text-sm not-italic leading-relaxed text-fg-muted">
              <span className="block font-medium text-fg">
                {order.ship_to?.full_name}
              </span>
              {order.ship_to?.line1}
              {order.ship_to?.line2 && <>, {order.ship_to.line2}</>}
              <br />
              {order.ship_to?.city}, {order.ship_to?.state}{" "}
              {order.ship_to?.postal_code}
              <br />
              {order.ship_to?.country}
            </address>

            <h2 className="mb-1 mt-4 font-bold">Payment</h2>
            <p className="text-sm text-fg-muted">
              {order.payment_brand} ending in {order.payment_last4}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

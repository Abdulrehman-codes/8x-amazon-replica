"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { placeOrder, type CheckoutState } from "@/lib/actions/orders";
import {
  DELIVERY_OPTIONS,
  deliveryDate,
  formatDeliveryDate,
  shippingCentsFor,
  taxCentsFor,
} from "@/lib/delivery";
import { formatPrice, cn } from "@/lib/utils";
import type { Address, CartLine, DeliverySpeed } from "@/lib/types";

export function CheckoutForm({
  lines,
  addresses,
  defaultName,
  extraDays = 0,
}: {
  lines: CartLine[];
  addresses: Address[];
  defaultName: string;
  extraDays?: number;
}) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    placeOrder,
    {},
  );

  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "",
  );
  const [speed, setSpeed] = useState<DeliverySpeed>("standard");

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.price_cents * l.qty, 0),
    [lines],
  );
  const shipping = shippingCentsFor(speed, subtotal);
  const tax = taxCentsFor(subtotal);
  const total = subtotal + shipping + tax;

  const slowest = Math.max(...lines.map((l) => l.product.ship_days)) + extraDays;
  const eta = deliveryDate(slowest, speed);

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        {/* 1 — Address */}
        <Section step={1} title="Delivery address">
          {addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded border p-3 text-sm transition",
                    addressId === address.id
                      ? "border-link bg-accent-soft/40"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">
                      {address.full_name}
                    </span>
                    <span className="block text-fg-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                      {address.state} {address.postal_code}
                    </span>
                  </span>
                </label>
              ))}

              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded border p-3 text-sm transition",
                  addressId === ""
                    ? "border-link bg-accent-soft/40"
                    : "border-border hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="addressId"
                  value=""
                  checked={addressId === ""}
                  onChange={() => setAddressId("")}
                />
                Deliver somewhere else
              </label>
            </div>
          )}

          {addressId === "" && <NewAddressFields defaultName={defaultName} />}
        </Section>

        {/* 2 — Speed */}
        <Section step={2} title="Delivery options">
          <div className="space-y-2">
            {DELIVERY_OPTIONS.map((option) => {
              const optionEta = deliveryDate(slowest, option.key);
              const cost = shippingCentsFor(option.key, subtotal);
              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded border p-3 text-sm transition",
                    speed === option.key
                      ? "border-link bg-accent-soft/40"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="speed"
                    value={option.key}
                    checked={speed === option.key}
                    onChange={() => setSpeed(option.key)}
                    className="mt-1"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold">
                      {formatDeliveryDate(optionEta)}
                    </span>
                    <span className="block text-fg-muted">
                      {option.label} — {option.note}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {cost === 0 ? "FREE" : formatPrice(cost)}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>

        {/* 3 — Payment */}
        <Section step={3} title="Payment method">
          <p className="mb-3 flex items-center gap-2 rounded bg-canvas px-3 py-2 text-xs text-fg-muted">
            <Lock size={13} className="shrink-0" />
            This storefront is a demonstration. No card is charged and no card
            number is stored — only the last four digits are kept, to render
            your order history.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Card number"
              name="cardNumber"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              defaultValue="4242 4242 4242 4242"
              className="sm:col-span-2"
              required
            />
            <Field
              label="Name on card"
              name="cardName"
              defaultValue={defaultName}
              className="sm:col-span-2"
              required
            />
            <Field
              label="Expiry (MM/YY)"
              name="cardExpiry"
              placeholder="04/28"
              defaultValue="04/28"
              required
            />
            <Field
              label="Security code"
              name="cardCvc"
              inputMode="numeric"
              placeholder="123"
              defaultValue="123"
              required
            />
          </div>
        </Section>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-3 lg:sticky lg:top-32">
        <div className="rounded-card bg-surface p-4 shadow-sm">
          <PlaceOrderButton total={total} />

          {state.error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded border border-price/30 bg-price/5 px-3 py-2 text-sm text-price"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {state.error}
            </p>
          )}

          <p className="mt-3 text-center text-xs text-fg-muted">
            Arrives{" "}
            <span className="font-semibold text-fg">
              {formatDeliveryDate(eta)}
            </span>
          </p>

          <hr className="my-3 border-border" />

          <h2 className="mb-2 font-bold">Order summary</h2>
          <dl className="space-y-1.5 text-sm">
            <Line label={`Items (${lines.reduce((s, l) => s + l.qty, 0)})`} value={formatPrice(subtotal)} />
            <Line
              label="Delivery"
              value={shipping === 0 ? "FREE" : formatPrice(shipping)}
            />
            <Line label="Estimated tax" value={formatPrice(tax)} />
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold text-price">
              <dt>Order total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-card bg-surface p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold">
            {lines.length} item{lines.length === 1 ? "" : "s"} in this order
          </h2>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-canvas">
                  <Image
                    src={line.product.images[0]}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1 text-xs">
                  <span className="line-clamp-2-safe text-fg">
                    {line.product.title}
                  </span>
                  <span className="mt-0.5 block text-fg-muted">
                    Qty {line.qty} ·{" "}
                    {formatPrice(line.product.price_cents * line.qty)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}

function NewAddressFields({ defaultName }: { defaultName: string }) {
  const [values, setValues] = useState({
    full_name: defaultName,
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
  });

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
  }

  return (
    <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      {/* Sent as one JSON field so the action validates a single object. */}
      <input type="hidden" name="address" value={JSON.stringify(values)} />

      <Field label="Full name" value={values.full_name} onChange={update("full_name")} className="sm:col-span-2" />
      <Field label="Street address" value={values.line1} onChange={update("line1")} className="sm:col-span-2" />
      <Field label="Apartment, suite (optional)" value={values.line2} onChange={update("line2")} className="sm:col-span-2" />
      <Field label="City" value={values.city} onChange={update("city")} />
      <Field label="State" value={values.state} onChange={update("state")} />
      <Field label="ZIP code" value={values.postal_code} onChange={update("postal_code")} />
      <Field label="Phone (optional)" value={values.phone} onChange={update("phone")} />
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-surface p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-semibold text-fg-muted">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded border border-border-strong px-3 py-2 text-sm outline-none focus:border-link"
      />
    </label>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PlaceOrderButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:opacity-70"
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending ? "Placing order…" : `Place your order — ${formatPrice(total)}`}
    </button>
  );
}

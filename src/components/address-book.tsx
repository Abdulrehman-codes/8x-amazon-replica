"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Plus, Star } from "lucide-react";
import {
  saveAddress,
  deleteAddress,
  makeDefaultAddress,
  type AccountState,
} from "@/lib/actions/account";
import { cn } from "@/lib/utils";
import type { Address } from "@/lib/types";

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  return (
    <div className="space-y-4">
      {editing ? (
        <AddressForm
          address={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border-strong bg-surface py-5 text-sm font-semibold text-fg-muted transition hover:border-link hover:text-link"
        >
          <Plus size={16} />
          Add a new address
        </button>
      )}

      {addresses.length === 0 && !editing && (
        <p className="rounded-card bg-surface px-5 py-8 text-center text-sm text-fg-muted shadow-sm">
          No saved addresses yet. Adding one here means you won&apos;t have to
          type it at checkout.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className={cn(
              "rounded-card border bg-surface p-4 text-sm",
              address.is_default ? "border-link" : "border-border",
            )}
          >
            {address.is_default && (
              <span className="mb-2 inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-fg">
                <Star size={11} fill="currentColor" strokeWidth={0} />
                Default
              </span>
            )}

            <p className="font-semibold">{address.full_name}</p>
            <p className="mt-0.5 leading-relaxed text-fg-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.postal_code}
              <br />
              {address.country}
              {address.phone && (
                <>
                  <br />
                  {address.phone}
                </>
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => setEditing(address)}
                className="text-link hover:text-link-hover"
              >
                Edit
              </button>

              <span className="text-border-strong">|</span>

              <form action={deleteAddress}>
                <input type="hidden" name="id" value={address.id} />
                <SmallSubmit label="Remove" />
              </form>

              {!address.is_default && (
                <>
                  <span className="text-border-strong">|</span>
                  <form action={makeDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <SmallSubmit label="Set as default" />
                  </form>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddressForm({
  address,
  onDone,
}: {
  address: Address | null;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<AccountState, FormData>(
    async (prev, formData) => {
      const result = await saveAddress(prev, formData);
      if (result.ok) onDone();
      return result;
    },
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-card border border-border bg-surface p-5"
    >
      <h3 className="mb-3 font-bold">
        {address ? "Edit address" : "Add a new address"}
      </h3>

      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" name="full_name" defaultValue={address?.full_name} className="sm:col-span-2" required />
        <Field label="Street address" name="line1" defaultValue={address?.line1} className="sm:col-span-2" required />
        <Field label="Apartment, suite (optional)" name="line2" defaultValue={address?.line2 ?? ""} className="sm:col-span-2" />
        <Field label="City" name="city" defaultValue={address?.city} required />
        <Field label="State or region" name="state" defaultValue={address?.state} required />
        <Field label="Postal code" name="postal_code" defaultValue={address?.postal_code} required />
        <Field label="Country" name="country" defaultValue={address?.country ?? "United States"} required />
        <Field label="Phone (optional)" name="phone" defaultValue={address?.phone ?? ""} className="sm:col-span-2" />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={address?.is_default}
        />
        Use this as my default delivery address
      </label>

      {state.error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded border border-price/30 bg-price/5 px-3 py-2 text-sm text-price">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-3 flex items-start gap-2 rounded border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          {state.ok}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <SaveButton />
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-border-strong px-5 py-2 text-sm font-semibold transition hover:bg-canvas"
        >
          Cancel
        </button>
      </div>
    </form>
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

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:opacity-70"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Save address
    </button>
  );
}

function SmallSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-link hover:text-link-hover disabled:opacity-50"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

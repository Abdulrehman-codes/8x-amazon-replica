"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Tag, X } from "lucide-react";
import Link from "next/link";
import {
  applyCoupon,
  removeCoupon,
  type CouponState,
} from "@/lib/actions/coupons";
import { formatPrice } from "@/lib/utils";

export function CouponBox({
  appliedCode,
  discountCents,
  freeShipping,
}: {
  appliedCode: string | null;
  discountCents: number;
  freeShipping: boolean;
}) {
  const [state, formAction] = useActionState<CouponState, FormData>(
    applyCoupon,
    {},
  );

  if (appliedCode) {
    return (
      <div className="rounded border border-success/40 bg-success/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <Tag size={14} />
              {appliedCode} applied
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {freeShipping
                ? "Delivery is on us."
                : `Taking ${formatPrice(discountCents)} off this order.`}
            </p>
          </div>

          <form action={removeCoupon}>
            <button
              type="submit"
              aria-label="Remove coupon"
              className="rounded p-1 text-fg-subtle transition hover:bg-canvas hover:text-fg"
            >
              <X size={15} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Its own form: nesting one inside the checkout form would submit the
          order every time someone tried a code. */}
      <form action={formAction} className="flex gap-2">
        <label className="sr-only" htmlFor="coupon-code">
          Promotion code
        </label>
        <input
          id="coupon-code"
          name="code"
          placeholder="Promotion code"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded border border-border-strong px-3 py-2 text-sm uppercase outline-none transition focus:border-link"
        />
        <ApplyButton />
      </form>

      {state.error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-price">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      <p className="mt-2 text-xs text-fg-subtle">
        No code?{" "}
        <Link href="/coupons" className="text-link hover:text-link-hover">
          See available vouchers
        </Link>
      </p>
    </div>
  );
}

function ApplyButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded border border-border-strong px-4 py-2 text-sm font-semibold transition hover:bg-canvas disabled:opacity-70"
    >
      {pending && <Loader2 size={13} className="animate-spin" />}
      Apply
    </button>
  );
}

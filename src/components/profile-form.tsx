"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updateProfile, type AccountState } from "@/lib/actions/account";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, formAction] = useActionState<AccountState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="max-w-sm">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-fg-muted">
          Your name
        </span>
        <input
          name="full_name"
          defaultValue={fullName}
          required
          className="w-full rounded border border-border-strong px-3 py-2 text-sm outline-none focus:border-link"
        />
      </label>

      {state.error && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-price">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-2 flex items-start gap-2 text-sm text-success">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          {state.ok}
        </p>
      )}

      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 flex items-center gap-2 rounded-full border border-border-strong px-5 py-2 text-sm font-semibold transition hover:bg-canvas disabled:opacity-70"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      Save name
    </button>
  );
}

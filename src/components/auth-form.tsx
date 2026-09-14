"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  signInAction,
  signUpAction,
  demoSignInAction,
  type AuthState,
} from "@/lib/actions/auth";

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "signin" | "signup";
  next: string;
  /** Surfaced by the confirmation-link handler when a link fails. */
  initialError?: string;
}) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {
    error: initialError,
  });

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-card border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="next" value={next} />

          {mode === "signup" && (
            <Field
              label="Your name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="First and last name"
              required
            />
          )}

          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />

          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            hint={mode === "signup" ? "At least 8 characters" : undefined}
            required
          />

          {state.notice && (
            <p
              role="status"
              className="flex items-start gap-2 rounded border border-success/30 bg-success/5 px-3 py-2 text-sm text-success"
            >
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              {state.notice}
            </p>
          )}

          {state.error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded border border-price/30 bg-price/5 px-3 py-2 text-sm text-price"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {state.error}
            </p>
          )}

          <SubmitButton
            label={mode === "signin" ? "Sign in" : "Create your account"}
          />
        </form>

        <p className="mt-4 text-xs leading-relaxed text-fg-muted">
          This is a demonstration storefront. Use a throwaway email — no real
          messages are sent and no payments are processed.
        </p>
      </div>

      <div className="relative my-5 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-surface px-3 text-xs text-fg-subtle">
          or
        </span>
      </div>

      <form action={demoSignInAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full rounded-md border border-border-strong bg-surface py-2.5 text-sm font-semibold transition hover:bg-canvas"
        >
          Continue as the demo shopper
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-fg-subtle">
        A ready-made account with saved addresses and past orders
      </p>

      <p className="mt-6 text-center text-sm text-fg-muted">
        {mode === "signin" ? (
          <>
            New to Bazaar?{" "}
            <Link href="/signup" className="text-link hover:text-link-hover">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-link hover:text-link-hover">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="w-full rounded border border-border-strong px-3 py-2 text-sm outline-none focus:border-link"
      />
      {hint && <span className="mt-1 block text-xs text-fg-subtle">{hint}</span>}
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover disabled:opacity-70"
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {label}
    </button>
  );
}

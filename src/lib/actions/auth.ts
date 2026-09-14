"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../demo";

export type AuthState = {
  error?: string;
  /** Shown when the account exists but cannot be used yet. */
  notice?: string;
};

const credentials = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Passwords must be at least 8 characters."),
});

const signUpSchema = credentials.extend({
  fullName: z.string().min(1, "Tell us your name."),
});

/** Keeps a caller from being redirected off-site by a crafted ?next= value. */
function safeRedirect(target: FormDataEntryValue | null) {
  const value = typeof target === "string" ? target : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

type SupabaseAuthError = { message: string; code?: string; status?: number };

/**
 * Supabase's raw messages are either too terse to act on or too revealing.
 * These say what the person should do next.
 */
function explain(error: SupabaseAuthError): string {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "email_not_confirmed" || message.includes("not confirmed")) {
    return "That account still needs to be confirmed. Check your inbox for the confirmation link, or use the demo account below.";
  }
  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "Too many confirmation emails have been sent from this project recently. Wait an hour, or use the demo account below.";
  }
  if (code === "user_already_exists" || message.includes("already registered")) {
    return "An account already exists for that email. Try signing in instead.";
  }
  if (message.includes("is invalid")) {
    return "That email address was rejected. Try a different one.";
  }
  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return "That email and password combination didn't work.";
  }
  if (message.includes("weak") || message.includes("password")) {
    return "That password is too weak. Use at least 8 characters.";
  }
  return error.message;
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: explain(error) };
  if (!data.session) {
    return { error: "Signed in, but no session was returned. Try again." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("next")));
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) return { error: explain(error) };

  // With email confirmation switched on, sign-up succeeds but returns no
  // session. Redirecting here would drop the person on the home page looking
  // signed out with no explanation, which is exactly what used to happen.
  if (!data.session) {
    return {
      notice:
        `Account created for ${parsed.data.email}. Confirm it from the link ` +
        `we sent before signing in — or use the demo account below to look ` +
        `around straight away.`,
    };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("next")));
}

/**
 * One-click sign-in to a pre-populated account. Anyone evaluating the app
 * should reach a filled cart and real order history without inventing
 * credentials first.
 */
export async function demoSignInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("next")));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

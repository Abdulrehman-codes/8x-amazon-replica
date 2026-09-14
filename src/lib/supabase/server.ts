import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Always create a fresh one per request — never hoist it to a module global,
 * or one visitor's session leaks into another's render.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. The proxy refreshes the
            // session on every request, so dropping the write here is safe.
          }
        },
      },
    },
  );
}

/**
 * The signed-in user, verified against the auth server.
 *
 * Deduped per request: several server components ask for the user while
 * rendering one page, and each uncached call is a network round trip.
 * Use this wherever the answer decides access — checkout, orders, account.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The viewer's display name, or null.
 *
 * Reads the claims out of the session JWT and verifies them locally against
 * cached JWKS rather than calling the auth server, because the header renders
 * on every page and a greeting does not justify a round trip. Anything that
 * grants access must use `getCurrentUser` instead.
 */
export const getViewerName = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  try {
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) return null;

    const metadata = claims.user_metadata as
      | { full_name?: string }
      | undefined;
    const email = typeof claims.email === "string" ? claims.email : undefined;

    return metadata?.full_name ?? email?.split("@")[0] ?? null;
  } catch {
    return null;
  }
});

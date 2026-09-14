import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous, cookie-free client for catalog reads.
 *
 * Deliberately separate from the SSR client: touching cookies() opts a route
 * into dynamic rendering, and the catalog is the same for every visitor, so
 * product and search pages should not pay for a session lookup.
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

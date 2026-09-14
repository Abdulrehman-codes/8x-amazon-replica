/**
 * Credentials for the pre-populated demo account.
 *
 * These live outside `lib/actions/auth.ts` because a "use server" module may
 * only export async functions — exporting a constant from one silently
 * invalidates every export in the file.
 *
 * `scripts/seed.mjs` provisions this account and repeats these literals; the
 * two must stay in step.
 */
export const DEMO_EMAIL = "demo@bazaar.shop";
export const DEMO_PASSWORD = "demo-shopper-2024";

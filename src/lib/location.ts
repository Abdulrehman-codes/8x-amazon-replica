import { cookies } from "next/headers";

export const LOCATION_COOKIE = "bazaar_location";

export type DeliveryLocation = {
  city: string;
  postal: string;
  country: string;
  /** ISO-3166 alpha-2, used to decide domestic vs international transit. */
  code: string;
};

/** Where the store ships from when nothing has been chosen. */
export const DEFAULT_LOCATION: DeliveryLocation = {
  city: "Seattle",
  postal: "98101",
  country: "United States",
  code: "US",
};

export function parseLocation(raw: string | undefined): DeliveryLocation | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (typeof v?.city !== "string" || typeof v?.country !== "string") return null;
    return {
      city: String(v.city).slice(0, 60),
      postal: String(v.postal ?? "").slice(0, 16),
      country: String(v.country).slice(0, 60),
      code: String(v.code ?? "").slice(0, 2).toUpperCase(),
    };
  } catch {
    return null;
  }
}

export async function getLocation(): Promise<DeliveryLocation> {
  const store = await cookies();
  return parseLocation(store.get(LOCATION_COOKIE)?.value) ?? DEFAULT_LOCATION;
}

/**
 * Extra days on top of a product's handling time.
 *
 * The warehouses are notionally in the US, so anywhere else picks up customs
 * and long-haul transit. Crude, but it is honest about being an estimate and
 * it makes the chosen location actually mean something.
 */
export function transitDaysFor(location: DeliveryLocation) {
  if (!location.code || location.code === "US") return 0;
  if (["CA", "MX"].includes(location.code)) return 2;
  if (["GB", "IE", "FR", "DE", "ES", "IT", "NL", "BE"].includes(location.code)) {
    return 4;
  }
  return 6;
}

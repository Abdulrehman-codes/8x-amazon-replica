"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LOCATION_COOKIE } from "../location";

const schema = z.object({
  city: z.string().min(1, "Enter a city.").max(60),
  postal: z.string().max(16).optional().default(""),
  country: z.string().min(2, "Enter a country.").max(60),
  code: z.string().max(2).optional().default(""),
});

export type LocationState = { error?: string };

export async function setLocation(
  _prev: LocationState,
  formData: FormData,
): Promise<LocationState> {
  const parsed = schema.safeParse({
    city: formData.get("city"),
    postal: formData.get("postal") ?? "",
    country: formData.get("country"),
    code: formData.get("code") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await cookies();
  store.set(
    LOCATION_COOKIE,
    JSON.stringify({
      city: parsed.data.city,
      postal: parsed.data.postal,
      country: parsed.data.country,
      code: parsed.data.code.toUpperCase(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      secure: process.env.NODE_ENV === "production",
    },
  );

  // Delivery dates are quoted in the header, on cards and in the buy box.
  revalidatePath("/", "layout");
  return {};
}

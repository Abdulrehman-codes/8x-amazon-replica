"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export type AccountState = { error?: string; ok?: string };

const addressSchema = z.object({
  full_name: z.string().min(2, "Enter the recipient's full name."),
  line1: z.string().min(3, "Enter a street address."),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter a city."),
  state: z.string().min(1, "Enter a state or region."),
  postal_code: z.string().min(3, "Enter a postal code."),
  country: z.string().min(2, "Enter a country."),
  phone: z.string().optional(),
});

function readAddress(formData: FormData) {
  return addressSchema.safeParse({
    full_name: formData.get("full_name"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    postal_code: formData.get("postal_code"),
    country: formData.get("country") || "United States",
    phone: formData.get("phone") || undefined,
  });
}

/** Only one address can be the default, so clear the rest in the same breath. */
async function promoteDefault(userId: string, addressId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .neq("id", addressId);
  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("user_id", userId)
    .eq("id", addressId);
}

export async function saveAddress(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage your addresses." };

  const parsed = readAddress(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = formData.get("id");
  const makeDefault = formData.get("is_default") === "on";

  if (typeof id === "string" && id) {
    // RLS scopes this to the caller; the user_id filter states the intent.
    const { error } = await supabase
      .from("addresses")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "We couldn't save that address." };
    if (makeDefault) await promoteDefault(user.id, id);
    revalidatePath("/account/addresses");
    return { ok: "Address updated." };
  }

  const { data: created, error } = await supabase
    .from("addresses")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();
  if (error || !created) return { error: "We couldn't save that address." };

  // The first address a person adds is their default, whatever they ticked.
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (makeDefault || count === 1) await promoteDefault(user.id, created.id);

  revalidatePath("/account/addresses");
  return { ok: "Address added." };
}

export async function deleteAddress(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { data: removed } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  // Deleting the default leaves nobody in charge; promote the newest survivor.
  if (removed?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) await promoteDefault(user.id, next.id);
  }

  revalidatePath("/account/addresses");
}

export async function makeDefaultAddress(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await promoteDefault(user.id, id);
  revalidatePath("/account/addresses");
}

export async function updateProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update your details." };

  const parsed = z
    .string()
    .min(1, "Tell us your name.")
    .max(80, "That name is too long.")
    .safeParse(formData.get("full_name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Written to both places: the JWT claim the header reads, and the profiles
  // row. Updating only one would make the greeting disagree with the account.
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data },
  });
  if (authError) return { error: "We couldn't update your name." };

  await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: parsed.data });

  revalidatePath("/", "layout");
  return { ok: "Name updated." };
}

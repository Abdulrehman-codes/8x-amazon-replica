import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { AddressBook } from "@/components/address-book";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Your addresses" };

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=%2Faccount%2Faddresses");

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[900px] px-3 py-6">
      <Link
        href="/account"
        className="mb-3 inline-flex items-center gap-1 text-sm text-link hover:text-link-hover"
      >
        <ChevronLeft size={15} />
        Your account
      </Link>

      <h1 className="text-2xl font-semibold">Your addresses</h1>
      <p className="mb-5 mt-1 text-sm text-fg-muted">
        Signed in as <span className="font-medium text-fg">{user.email}</span>
      </p>

      <AddressBook addresses={(data ?? []) as Address[]} />
    </div>
  );
}

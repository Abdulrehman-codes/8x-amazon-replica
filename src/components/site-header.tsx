import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Logo } from "@/components/logo";
import { SearchBar } from "@/components/search-bar";
import { AccountMenu } from "@/components/account-menu";
import { NavDrawer } from "@/components/nav-drawer";
import { LocationPicker } from "@/components/location-picker";
import { getNav } from "@/lib/queries";
import { getCartCount } from "@/lib/cart";
import { getLocation } from "@/lib/location";
import { getViewerName } from "@/lib/supabase/server";

export async function SiteHeader() {
  const [departments, cartCount, name, location] = await Promise.all([
    getNav(),
    getCartCount(),
    getViewerName(),
    getLocation(),
  ]);

  return (
    <header className="sticky top-0 z-40">
      {/* Primary bar */}
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-2">
          <Logo />

          <LocationPicker location={location} />

          <div className="mx-1 min-w-0 flex-1">
            <Suspense
              fallback={<div className="h-10 rounded-md bg-white/90" />}
            >
              <SearchBar departments={departments} />
            </Suspense>
          </div>

          <AccountMenu name={name} />

          <Link
            href="/orders"
            className="hidden rounded px-2 py-1.5 leading-tight text-white/90 transition hover:bg-ink-hover md:block"
          >
            <span className="block text-[11px] text-white/70">Returns</span>
            <span className="block text-sm font-semibold">&amp; Orders</span>
          </Link>

          <Link
            href="/cart"
            className="flex items-end gap-1 rounded px-2 py-1.5 transition hover:bg-ink-hover"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          >
            <span className="relative">
              <ShoppingCart size={26} strokeWidth={1.5} />
              <span className="absolute -top-1 left-1/2 min-w-5 -translate-x-1/2 rounded-full bg-accent px-1 text-center text-xs font-bold text-ink">
                {cartCount}
              </span>
            </span>
            <span className="hidden text-sm font-semibold sm:block">Cart</span>
          </Link>
        </div>
      </div>

      {/* Department bar */}
      <div className="bg-ink-soft text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 no-scrollbar">
          <NavDrawer departments={departments} />
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/s?department=${dept.slug}`}
              className="whitespace-nowrap rounded px-2.5 py-1.5 text-sm text-white/90 transition hover:bg-ink-hover"
            >
              {dept.name}
            </Link>
          ))}
          <Link
            href="/s?deals=1&sort=featured"
            className="whitespace-nowrap rounded px-2.5 py-1.5 text-sm font-semibold text-accent transition hover:bg-ink-hover"
          >
            Today&apos;s Deals
          </Link>
        </div>
      </div>
    </header>
  );
}

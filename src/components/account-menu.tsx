"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { demoSignInAction, signOutAction } from "@/lib/actions/auth";

/**
 * Two columns, like the original's flyout — but every entry goes somewhere
 * that exists. A menu full of dead links is worse than a short menu.
 */
const ACCOUNT_LINKS = [
  { href: "/orders", label: "Your orders" },
  { href: "/account/addresses", label: "Your addresses" },
  { href: "/account", label: "Account settings" },
  { href: "/cart", label: "Your cart" },
];

const SHOP_LINKS = [
  { href: "/s?deals=1&sort=featured", label: "Today's deals" },
  { href: "/s?sort=rating", label: "Top rated" },
  { href: "/s?department=books", label: "Books" },
  { href: "/s?maxPrice=2500", label: "Under $25" },
  { href: "/s?prime=1", label: "Express delivery" },
];

export function AccountMenu({ name }: { name: string | null }) {
  const pathname = usePathname();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-1 rounded px-2 py-1.5 text-left text-white/90 transition hover:bg-ink-hover">
        <span className="leading-tight">
          <span className="block text-[11px] text-white/70">
            Hello, {name ?? "sign in"}
          </span>
          <span className="block text-sm font-semibold">Account &amp; Lists</span>
        </span>
        <ChevronDown size={14} className="mt-2.5 opacity-70" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[22rem] rounded-card border border-border bg-surface p-4 shadow-xl"
        >
          {name ? (
            <>
              <p className="border-b border-border pb-2 text-sm font-semibold">
                Hello, {name}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <Column title="Your account" links={ACCOUNT_LINKS} />
                <Column title="Keep shopping" links={SHOP_LINKS} />
              </div>

              <form action={signOutAction} className="mt-3 border-t border-border pt-2">
                <button
                  type="submit"
                  className="w-full rounded px-1 py-1.5 text-left text-sm text-link hover:text-link-hover"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href={`/signin?next=${encodeURIComponent(pathname)}`}
                className="block w-full rounded-md bg-accent py-2 text-center text-sm font-semibold text-ink transition hover:bg-accent-hover"
              >
                Sign in
              </Link>
              <p className="mt-2 text-center text-xs text-fg-muted">
                New customer?{" "}
                <Link href="/signup" className="text-link hover:text-link-hover">
                  Start here
                </Link>
              </p>

              <div className="mt-3 grid grid-cols-2 gap-4 border-t border-border pt-3">
                <Column title="Your account" links={ACCOUNT_LINKS} />
                <Column title="Keep shopping" links={SHOP_LINKS} />
              </div>

              <form
                action={demoSignInAction}
                className="mt-3 border-t border-border pt-3"
              >
                <input type="hidden" name="next" value={pathname} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-border-strong py-2 text-sm font-medium text-fg transition hover:bg-canvas"
                >
                  Browse as the demo shopper
                </button>
                <p className="mt-1.5 text-center text-[11px] text-fg-subtle">
                  Signs you in instantly with sample orders
                </p>
              </form>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-bold">{title}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <DropdownMenu.Item asChild>
              <Link
                href={link.href}
                className="block rounded py-0.5 text-[13px] text-fg-muted outline-none transition hover:text-link-hover focus:text-link-hover"
              >
                {link.label}
              </Link>
            </DropdownMenu.Item>
          </li>
        ))}
      </ul>
    </div>
  );
}

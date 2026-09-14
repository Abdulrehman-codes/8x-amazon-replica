"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { demoSignInAction, signOutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/orders", label: "Your orders" },
  { href: "/account", label: "Your account" },
  { href: "/cart", label: "Your cart" },
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
          className="z-50 w-64 rounded-card border border-border bg-surface p-3 shadow-lg"
        >
          {name ? (
            <>
              <p className="px-1 pb-2 text-sm font-semibold">Hello, {name}</p>
              {LINKS.map((link) => (
                <DropdownMenu.Item key={link.href} asChild>
                  <Link
                    href={link.href}
                    className="block rounded px-1 py-1.5 text-sm text-fg outline-none hover:bg-canvas focus:bg-canvas"
                  >
                    {link.label}
                  </Link>
                </DropdownMenu.Item>
              ))}
              <form action={signOutAction} className="mt-2 border-t border-border pt-2">
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

import Link from "next/link";

/**
 * Sign-in and sign-up drop the department chrome. Nothing on those pages
 * should compete with the single thing the visitor came to do.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex justify-center py-6">
        <Link href="/" aria-label="Bazaar home" className="block">
          <span className="block text-3xl font-bold leading-none tracking-tight text-fg">
            bazaar
          </span>
          <svg viewBox="0 0 84 10" className="mt-1 h-2 w-[6.5rem] text-accent" aria-hidden="true">
            <path d="M2 2.5C18 8.5 62 8.5 78 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M72 1.2L79.5 2.6L75.5 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      <main className="flex-1 px-4">{children}</main>

      <footer className="border-t border-border py-6 text-center text-xs text-fg-subtle">
        Bazaar is a demonstration storefront. No real payments are processed.
      </footer>
    </div>
  );
}

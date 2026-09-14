import Link from "next/link";
import { getNav } from "@/lib/queries";

export async function SiteFooter() {
  const departments = await getNav();

  return (
    <footer className="mt-12">
      <Link
        href="#top"
        className="block bg-ink-soft py-3 text-center text-sm text-white transition hover:bg-ink-hover"
      >
        Back to top
      </Link>

      <div className="bg-ink text-white">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="mb-3 text-sm font-semibold">Shop by department</h2>
            <ul className="space-y-2 text-sm text-white/70">
              {departments.slice(0, 5).map((d) => (
                <li key={d.slug}>
                  <Link href={`/s?department=${d.slug}`} className="hover:underline">
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Your account</h2>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/orders" className="hover:underline">Your orders</Link></li>
              <li><Link href="/cart" className="hover:underline">Your cart</Link></li>
              <li><Link href="/account" className="hover:underline">Account settings</Link></li>
              <li><Link href="/signin" className="hover:underline">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Delivery</h2>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Free standard delivery over $35</li>
              <li>Express delivery in two days</li>
              <li>Same-day in select cities</li>
              <li>Free returns within 30 days</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">About this project</h2>
            <p className="text-sm leading-relaxed text-white/70">
              Bazaar is an independent rebuild of a large online storefront,
              built as a portfolio exercise. It is not affiliated with any
              retailer, and no real payments are processed.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Bazaar — a demonstration storefront.
        </div>
      </div>
    </footer>
  );
}

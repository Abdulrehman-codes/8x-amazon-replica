import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductRail } from "@/components/product-rail";
import { getHomeData, type DepartmentWithCategories } from "@/lib/queries";

export default async function HomePage() {
  const { nav, deals, topRated, underTwentyFive } = await getHomeData();

  return (
    <>
      <Hero />

      <div className="mx-auto max-w-[1500px] space-y-5 px-3 pb-10">
        {/* The card grid rides up over the hero, the way the original does. */}
        <div className="-mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nav.slice(0, 4).map((dept) => (
            <DepartmentCard key={dept.slug} department={dept} />
          ))}
        </div>

        <ProductRail
          title="Today's deals"
          href="/s?deals=1"
          products={deals}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nav.slice(4, 8).map((dept) => (
            <DepartmentCard key={dept.slug} department={dept} />
          ))}
        </div>

        <ProductRail
          title="Highest rated this week"
          href="/s?sort=rating"
          products={topRated}
        />

        <ProductRail
          title="Under $25"
          href="/s?maxPrice=2500"
          products={underTwentyFive}
        />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,#24405c_0%,#0d1520_60%)]"
      />
      <div className="relative mx-auto max-w-[1500px] px-6 pb-36 pt-14 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Free delivery over $35
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Everything you need, and it arrives when we say it will.
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/70">
          Two hundred thousand products across eight departments, with a real
          delivery date on every one of them — quoted before you buy, not after.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/s?deals=1"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
          >
            Shop today&apos;s deals
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/s?sort=rating"
            className="inline-flex items-center gap-2 rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Browse top rated
          </Link>
        </div>
      </div>
    </section>
  );
}

function DepartmentCard({
  department,
}: {
  department: DepartmentWithCategories;
}) {
  const tiles = department.categories.slice(0, 4);

  return (
    <article className="flex flex-col rounded-card bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold leading-tight">
        {department.name}
      </h2>

      {tiles.length >= 4 ? (
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((cat) => (
            <Link key={cat.slug} href={`/s?category=${cat.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded bg-canvas">
                {cat.image_url && (
                  <Image
                    src={cat.image_url}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-1 truncate text-xs text-fg-muted group-hover:text-link-hover">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <Link
          href={`/s?department=${department.slug}`}
          className="group relative block aspect-[4/3] overflow-hidden rounded bg-canvas"
        >
          {tiles[0]?.image_url && (
            <Image
              src={tiles[0].image_url}
              alt=""
              fill
              sizes="320px"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </Link>
      )}

      <Link
        href={`/s?department=${department.slug}`}
        className="mt-auto pt-3 text-sm text-link hover:text-link-hover"
      >
        Shop {department.name.toLowerCase()}
      </Link>
    </article>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Truck, RotateCcw, ShieldCheck, Plus, Zap } from "lucide-react";
import { DealCountdown } from "@/components/deal-countdown";
import { dealEndsAt, isLightningDeal, savingsCents } from "@/lib/deals";
import { Price, ListPrice } from "@/components/ui/price";
import { ImageGallery } from "@/components/image-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ReviewsSection } from "@/components/reviews-section";
import { ProductRail } from "@/components/product-rail";
import { Stars } from "@/components/ui/stars";
import { ExpressBadge } from "@/components/ui/express-badge";
import {
  getProduct,
  getReviews,
  getRelated,
  getBoughtTogether,
  getCategory,
} from "@/lib/queries";
import { deliveryDate, formatDeliveryDate } from "@/lib/delivery";
import { getLocation, transitDaysFor } from "@/lib/location";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export async function generateMetadata({
  params,
}: PageProps<"/dp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/dp/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  // Only the product and its breadcrumb are awaited here. Resolving them
  // before the response commits is what lets a missing product answer 404
  // rather than a streamed 200; everything below the fold arrives after.
  const [category, location] = await Promise.all([
    getCategory(product.category_slug),
    getLocation(),
  ]);
  const extraDays = transitDaysFor(location);
  const eta = deliveryDate(product.ship_days + extraDays);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-3 py-4">
      <nav className="text-xs text-fg-muted">
        <Link href="/" className="hover:text-link-hover">Home</Link>
        <span className="px-1.5">›</span>
        <Link
          href={`/s?category=${product.category_slug}`}
          className="hover:text-link-hover"
        >
          {category?.name ?? product.category_slug}
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-fg-subtle">{product.title}</span>
      </nav>

      <div className="grid gap-6 rounded-card bg-surface p-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_18rem] lg:p-6">
        <ImageGallery images={product.images} title={product.title} />

        {/* Centre column: identity, price, description */}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-snug">{product.title}</h1>

          {product.brand && (
            <Link
              href={`/s?k=${encodeURIComponent(product.brand)}`}
              className="mt-1 inline-block text-sm text-link hover:text-link-hover"
            >
              Visit the {product.brand} store
            </Link>
          )}

          <a
            href="#reviews"
            className="mt-2 flex items-center gap-2 text-sm hover:text-link-hover"
          >
            <Stars rating={product.rating} size={16} />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-link">
              {product.rating_count.toLocaleString()} ratings
            </span>
          </a>

          <hr className="my-4 border-border" />

          <div className="flex flex-wrap items-center gap-3">
            <Price cents={product.price_cents} size="lg" className="text-price" />
            <ListPrice
              listCents={product.list_price_cents}
              priceCents={product.price_cents}
            />
          </div>

          {isLightningDeal(product) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-card border border-accent/40 bg-accent-soft px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-fg">
                <Zap size={14} fill="currentColor" strokeWidth={0} className="text-accent" />
                Lightning deal
              </span>
              <span className="text-sm text-fg-muted">
                You save{" "}
                <span className="font-semibold text-success">
                  {formatPrice(savingsCents(product))}
                </span>
              </span>
              <DealCountdown endsAt={dealEndsAt(product).getTime()} />
            </div>
          )}
          {product.is_prime && <ExpressBadge className="mt-2" />}

          <hr className="my-4 border-border" />

          <h2 className="mb-2 text-sm font-bold">About this item</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg">
            {product.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            {product.description}
          </p>
        </div>

        {/* Buy box */}
        <div className="h-fit rounded-card border border-border p-4">
          <Price cents={product.price_cents} size="lg" className="text-price" />

          <p className="mt-3 text-sm text-fg-muted">
            FREE delivery{" "}
            <span className="font-semibold text-fg">
              {formatDeliveryDate(eta)}
            </span>{" "}
            to {location.city} on orders over $35
          </p>

          <p className="mt-2 text-sm">
            {product.stock > 10 ? (
              <span className="font-semibold text-success">In stock</span>
            ) : product.stock > 0 ? (
              <span className="font-semibold text-price">
                Only {product.stock} left — order soon
              </span>
            ) : (
              <span className="font-semibold text-fg-muted">Out of stock</span>
            )}
          </p>

          <AddToCart
            productId={product.id}
            stock={product.stock}
            title={product.title}
            image={product.images[0]}
            className="mt-4"
          />

          <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-fg-muted">
            <li className="flex gap-2">
              <Truck size={15} className="mt-px shrink-0 text-fg-subtle" />
              Ships from and sold by Bazaar
            </li>
            <li className="flex gap-2">
              <RotateCcw size={15} className="mt-px shrink-0 text-fg-subtle" />
              {product.return_policy ?? "30 days return policy"}
            </li>
            {product.warranty && (
              <li className="flex gap-2">
                <ShieldCheck size={15} className="mt-px shrink-0 text-fg-subtle" />
                {product.warranty}
              </li>
            )}
          </ul>
        </div>
      </div>

      <Suspense fallback={<ExtrasSkeleton />}>
        <ProductExtras product={product} categoryName={category?.name} />
      </Suspense>
    </div>
  );
}

/** Reviews, bundle and related products — streamed in after the buy box. */
async function ProductExtras({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  const [reviews, related, bundle] = await Promise.all([
    getReviews(product.id),
    getRelated(product.category_slug, product.id),
    getBoughtTogether(product.category_slug, product.id, product.price_cents),
  ]);

  return (
    <>
      {bundle.length > 0 && (
        <BoughtTogether product={product} bundle={bundle} />
      )}

      <ReviewsSection product={product} reviews={reviews} />

      <ProductRail
        title={`More in ${categoryName ?? "this category"}`}
        href={`/s?category=${product.category_slug}`}
        products={related}
      />
    </>
  );
}

function ExtrasSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-40 animate-pulse rounded-card bg-surface" />
      <div className="h-72 animate-pulse rounded-card bg-surface" />
    </div>
  );
}

function BoughtTogether({
  product,
  bundle,
}: {
  product: Product;
  bundle: Product[];
}) {
  const all = [product, ...bundle];
  const total = all.reduce((sum, p) => sum + p.price_cents, 0);

  return (
    <section className="rounded-card bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Frequently bought together</h2>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          {all.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3">
              {i > 0 && <Plus size={16} className="shrink-0 text-fg-subtle" />}
              <Link
                href={`/dp/${item.slug}`}
                className="relative block h-24 w-24 shrink-0 overflow-hidden rounded border border-border bg-surface"
              >
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  sizes="96px"
                  className="object-contain p-1.5"
                />
              </Link>
            </div>
          ))}
        </div>

        <div className="min-w-56">
          <p className="text-sm text-fg-muted">
            Total price:{" "}
            <span className="text-base font-semibold text-price">
              {formatPrice(total)}
            </span>
          </p>
          <ul className="mt-2 space-y-1 text-xs text-fg-muted">
            {all.map((item) => (
              <li key={item.id} className="truncate">
                <span className="font-medium text-fg">
                  {formatPrice(item.price_cents)}
                </span>{" "}
                — {item.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

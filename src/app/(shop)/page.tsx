import { HeroCarousel } from "@/components/hero-carousel";
import { ProductRail } from "@/components/product-rail";
import { LightningDeals } from "@/components/lightning-deals";
import { ShelfCard } from "@/components/shelf-card";
import { EndlessShelves } from "@/components/endless-shelves";
import { getHomeData, getShelves } from "@/lib/queries";
import { HERO_SLIDES } from "@/lib/shelves";

/**
 * Shelves rendered on the server before the scroll takes over.
 *
 * Kept deliberately small. Twelve shelves up front put 403KB and ~48 images
 * in the first response and doubled TTFB; eight lands the first screen quickly
 * and the observer — which sits 900px down and so fires almost immediately on
 * a page this tall — has the next batch in place before it is scrolled to.
 */
const FIRST_BATCH = 4;
const SECOND_BATCH = 4;

export default async function HomePage() {
  const [{ deals, topRated, underTwentyFive }, shelves] = await Promise.all([
    getHomeData(),
    getShelves(),
  ]);

  // One representative image per hero slide, pulled from that slide's category.
  const heroImages: Record<string, string> = {};
  for (const slide of HERO_SLIDES) {
    const shelf = shelves.find((s) => s.id === `cat-${slide.categorySlug}`);
    const tile = shelf?.tiles[0];
    if (tile) heroImages[slide.categorySlug] = tile.image;
  }

  const above = shelves.slice(0, FIRST_BATCH);
  const rest = shelves.slice(FIRST_BATCH, FIRST_BATCH + SECOND_BATCH);

  return (
    <>
      <HeroCarousel images={heroImages} />

      <div className="mx-auto max-w-[1500px] space-y-4 px-3 pb-6">
        {/* The first row rides up over the hero, the way the original does. */}
        <div className="stagger-children -mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {above.map((shelf) => (
            <ShelfCard key={shelf.id} shelf={shelf} />
          ))}
        </div>

        <LightningDeals products={deals} />

        <ProductRail
          title="Highest rated this week"
          href="/s?sort=rating"
          products={topRated}
        />

        {/* Everything below here keeps arriving as the visitor scrolls. */}
        <EndlessShelves
          initial={rest}
          initialOffset={FIRST_BATCH + rest.length}
          initialDone={FIRST_BATCH + rest.length >= shelves.length}
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

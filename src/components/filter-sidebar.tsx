import Link from "next/link";
import { Check } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { ExpressBadge } from "@/components/ui/express-badge";
import {
  buildHref,
  toggleInList,
  PRICE_BRACKETS,
  type RawSearchParams,
} from "@/lib/search-params";
import type { Facets } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Filters are links, not form controls: every state is a real URL that can be
 * shared, bookmarked and reached with the back button, and the whole sidebar
 * works with JavaScript disabled.
 */
export function FilterSidebar({
  facets,
  raw,
}: {
  facets: Facets;
  raw: RawSearchParams;
}) {
  const activeBrands = typeof raw.brands === "string" ? raw.brands : undefined;
  const activeCategory = typeof raw.category === "string" ? raw.category : undefined;
  const activeRating = typeof raw.rating === "string" ? raw.rating : undefined;
  const minPrice = typeof raw.minPrice === "string" ? raw.minPrice : undefined;
  const maxPrice = typeof raw.maxPrice === "string" ? raw.maxPrice : undefined;

  return (
    <aside className="w-56 shrink-0 space-y-6 text-sm">
      <Group title="Delivery">
        <Row
          href={buildHref(raw, { prime: raw.prime === "1" ? null : 1 })}
          active={raw.prime === "1"}
        >
          <ExpressBadge /> <span className="ml-1">two-day delivery</span>
        </Row>
        <Row
          href={buildHref(raw, { deals: raw.deals === "1" ? null : 1 })}
          active={raw.deals === "1"}
        >
          On sale today
        </Row>
      </Group>

      {facets.categories.length > 1 && (
        <Group title="Category">
          {facets.categories.slice(0, 10).map((cat) => (
            <Row
              key={cat.slug}
              href={buildHref(raw, {
                category: activeCategory === cat.slug ? null : cat.slug,
              })}
              active={activeCategory === cat.slug}
            >
              {cat.name}{" "}
              <span className="text-fg-subtle">({cat.count})</span>
            </Row>
          ))}
        </Group>
      )}

      <Group title="Price">
        {PRICE_BRACKETS.map((bracket) => {
          const isActive =
            String(bracket.min ?? "") === (minPrice ?? "") &&
            String(bracket.max ?? "") === (maxPrice ?? "");
          return (
            <Row
              key={bracket.label}
              href={buildHref(raw, {
                minPrice: isActive ? null : (bracket.min ?? null),
                maxPrice: isActive ? null : (bracket.max ?? null),
              })}
              active={isActive}
            >
              {bracket.label}
            </Row>
          );
        })}
      </Group>

      <Group title="Customer review">
        {[4, 3, 2].map((rating) => (
          <Row
            key={rating}
            href={buildHref(raw, {
              rating: activeRating === String(rating) ? null : rating,
            })}
            active={activeRating === String(rating)}
          >
            <span className="flex items-center gap-1.5">
              <Stars rating={rating} />
              <span className="text-fg-muted">&amp; up</span>
            </span>
          </Row>
        ))}
      </Group>

      {facets.brands.length > 1 && (
        <Group title="Brand">
          {facets.brands.slice(0, 12).map((brand) => {
            const selected = activeBrands?.split(",").includes(brand.value);
            return (
              <Row
                key={brand.value}
                href={buildHref(raw, {
                  brands: toggleInList(activeBrands, brand.value),
                })}
                active={Boolean(selected)}
                checkbox
              >
                {brand.value}{" "}
                <span className="text-fg-subtle">({brand.count})</span>
              </Row>
            );
          })}
        </Group>
      )}

      <Link
        href="/s"
        className="inline-block text-link hover:text-link-hover"
      >
        Clear all filters
      </Link>
    </aside>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 font-bold text-fg">{title}</h3>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Row({
  href,
  active,
  checkbox,
  children,
}: {
  href: string;
  active: boolean;
  checkbox?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded px-1 py-1 transition hover:text-link-hover",
          active ? "font-semibold text-fg" : "text-fg-muted",
        )}
      >
        {checkbox && (
          <span
            className={cn(
              "grid h-4 w-4 shrink-0 place-items-center rounded-sm border",
              active
                ? "border-link bg-link text-white"
                : "border-border-strong bg-surface",
            )}
          >
            {active && <Check size={12} strokeWidth={3} />}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </Link>
    </li>
  );
}

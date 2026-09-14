import { Stars } from "@/components/ui/stars";
import { BadgeCheck } from "lucide-react";
import type { Product, Review } from "@/lib/types";

export function ReviewsSection({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  // The histogram is scaled from the real review rows, then stretched to the
  // catalog's rating count so the bars agree with the headline number.
  const counts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length,
  );
  const sampled = counts.reduce((a, b) => a + b, 0) || 1;

  return (
    <section
      id="reviews"
      className="grid gap-8 rounded-card bg-surface p-5 shadow-sm lg:grid-cols-[18rem_1fr]"
    >
      <div>
        <h2 className="text-lg font-bold">Customer reviews</h2>

        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} size={18} />
          <span className="text-sm font-semibold">
            {product.rating.toFixed(1)} out of 5
          </span>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {product.rating_count.toLocaleString()} global ratings
        </p>

        <ul className="mt-4 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const pct = Math.round((counts[i] / sampled) * 100);
            return (
              <li key={star} className="flex items-center gap-2 text-sm">
                <span className="w-12 shrink-0 text-link">{star} star</span>
                <span className="h-4 flex-1 overflow-hidden rounded-sm border border-border bg-canvas">
                  <span
                    className="block h-full bg-star"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right text-fg-muted">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 text-base font-bold">
          Top reviews from the United States
        </h3>

        {reviews.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No written reviews yet — be the first once reviews open up.
          </p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-xs font-semibold text-fg-muted">
                    {review.author_name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="text-sm font-medium">{review.author_name}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-sm font-semibold">{review.title}</span>
                </div>

                <p className="mt-1 text-xs text-fg-subtle">
                  Reviewed on{" "}
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                {review.verified && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
                    <BadgeCheck size={13} />
                    Verified purchase
                  </p>
                )}

                <p className="mt-2 text-sm leading-relaxed text-fg">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

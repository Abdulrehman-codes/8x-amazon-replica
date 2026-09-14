/**
 * Open Library -> Bazaar product rows.
 *
 * Open Library publishes bibliographic data, not commerce data, so price,
 * stock and delivery are derived deterministically from the title. That keeps
 * a re-seed byte-identical while the parts that matter for browsing — title,
 * author, cover, publication year, length — are genuinely real.
 */

const FIELDS = [
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "number_of_pages_median",
  "first_sentence",
  "ratings_average",
  "ratings_count",
].join(",");

function hashUnit(str, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function pick(seed, salt, min, max) {
  return min + Math.floor(hashUnit(seed, salt) * (max - min + 1));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

async function fetchPage(subject, page) {
  const url =
    `https://openlibrary.org/search.json?q=subject%3A${encodeURIComponent(subject)}` +
    `&fields=${FIELDS}&limit=100&page=${page}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "bazaar-seed/1.0 (portfolio project)" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.docs ?? [];
    } catch (err) {
      if (attempt === 3) {
        console.warn(`    ${subject} p${page} failed: ${err.message}`);
        return [];
      }
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  return [];
}

/** A book is only usable if it has a cover, a title and an author. */
function usable(doc) {
  return (
    doc.cover_i &&
    typeof doc.title === "string" &&
    doc.title.trim().length > 1 &&
    doc.title.length <= 120 &&
    Array.isArray(doc.author_name) &&
    doc.author_name[0]
  );
}

function toProduct(doc, category) {
  const title = doc.title.trim();
  const author = doc.author_name[0];
  const seed = `${title}|${author}`;

  const pages = doc.number_of_pages_median ?? pick(seed, 1, 180, 520);
  const year = doc.first_publish_year ?? null;

  // Longer books cost more, with a deterministic wobble so prices vary.
  const base = 699 + Math.round(pages * 2.2) + pick(seed, 2, 0, 600);
  const priceCents = Math.min(base, 4999);
  const discount = pick(seed, 3, 0, 35);
  const listCents =
    discount > 5 ? Math.round(priceCents / (1 - discount / 100)) : priceCents;

  const sentence = Array.isArray(doc.first_sentence)
    ? doc.first_sentence[0]
    : typeof doc.first_sentence === "string"
      ? doc.first_sentence
      : null;

  const description = sentence
    ? `${sentence.trim().replace(/\s+/g, " ").slice(0, 400)}`
    : `${title} by ${author}${year ? `, first published in ${year}` : ""}. ` +
      `A ${category.name.toLowerCase().replace(/s$/, "")} title in the Bazaar books collection.`;

  const shipDays = pick(seed, 4, 1, 5);

  const bullets = [
    `Written by ${author}`,
    `${pages} pages, paperback edition`,
    year ? `First published in ${year}` : "Modern reissue edition",
    "30 days return policy — free returns, no questions asked",
    "Sold and shipped by Bazaar Books",
  ].filter(Boolean);

  // Open Library ratings are sparse; fall back to a plausible derived score.
  const rating =
    typeof doc.ratings_average === "number" && doc.ratings_average > 0
      ? Math.round(Math.min(5, doc.ratings_average) * 10) / 10
      : Math.round((35 + pick(seed, 5, 0, 15)) / 10 * 10) / 10;

  return {
    slug: `${slugify(title)}-${slugify(author)}`.slice(0, 90),
    title,
    brand: author,
    description,
    bullets,
    category_slug: category.slug,
    price_cents: priceCents,
    list_price_cents: listCents,
    rating,
    rating_count: doc.ratings_count ?? pick(seed, 6, 25, 4200),
    stock: pick(seed, 7, 0, 140),
    images: [`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`],
    tags: [category.name.toLowerCase(), "books", author.toLowerCase()],
    ship_days: shipDays,
    is_prime: shipDays <= 2,
    return_policy: "30 days return policy",
    warranty: null,
  };
}

/**
 * Returns book product rows across every subject, deduplicated by slug.
 */
export async function fetchBooks(subjects, pagesPerSubject) {
  const rows = [];
  const seen = new Set();

  for (const category of subjects) {
    let kept = 0;
    for (let page = 1; page <= pagesPerSubject; page++) {
      const docs = await fetchPage(category.subject, page);
      for (const doc of docs) {
        if (!usable(doc)) continue;
        const product = toProduct(doc, category);
        if (!product.slug || seen.has(product.slug)) continue;
        seen.add(product.slug);
        rows.push(product);
        kept++;
      }
    }
    console.log(`    ${category.name.padEnd(20)} ${kept}`);
  }

  return rows;
}

/** First cover in a category, used as the nav tile image. */
export function coverFor(rows, categorySlug) {
  return rows.find((r) => r.category_slug === categorySlug)?.images[0] ?? null;
}

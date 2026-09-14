/**
 * Editorial copy for the home grid.
 *
 * The original's home page is a wall of merchandised cards with a human
 * headline over a 2x2 of tiles. The headlines are the part a catalog can't
 * generate, so they live here, keyed by category, with a shape-based fallback
 * for anything not spelled out.
 */

export const CATEGORY_HEADLINES: Record<string, string> = {
  laptops: "Level up your PC here",
  smartphones: "Phones worth the upgrade",
  tablets: "Tablets for work and play",
  "mobile-accessories": "Little things, big difference",

  furniture: "Fantastic finds for home",
  "home-decoration": "Home harmony",
  "kitchen-accessories": "Shop kitchen must-haves",

  beauty: "Shop all things beauty",
  fragrances: "Unveil your radiance",
  "skin-care": "Skin care that shows up",

  "womens-dresses": "Dresses for every occasion",
  "womens-shoes": "Fashion trends in shoes",
  "womens-bags": "Shine brighter with your fashion faves",
  "womens-jewellery": "Everyday sparkle",
  "womens-watches": "Time, well accessorised",
  tops: "Tops to build a week around",

  "mens-shirts": "Start looking sharp",
  "mens-shoes": "Step out in style",
  "mens-watches": "Watches that earn a second look",
  sunglasses: "Shade, properly done",

  groceries: "Stock up and save",
  "sports-accessories": "Gear up to get fit",

  vehicle: "For the road ahead",
  motorcycle: "Two wheels, fewer problems",

  fiction: "Stories worth staying up for",
  "mystery-thrillers": "Whodunnits and can't-put-downs",
  "science-fiction": "Worlds one step sideways",
  fantasy: "Maps, magic and long journeys",
  "history-books": "How we got here",
  biographies: "Lives worth reading about",
  "childrens-books": "Toys for little ones — and stories",
  cookbooks: "Cook something new tonight",
  "business-books": "Sharpen the way you work",
  poetry: "Short lines, long echoes",
};

export const DEPARTMENT_HEADLINES: Record<string, string> = {
  electronics: "Plug in with our electronics",
  "home-kitchen": "Everything for the home",
  beauty: "Beauty and personal care picks",
  "womens-fashion": "Women's fashion edit",
  "mens-fashion": "Men's fashion edit",
  grocery: "Groceries, delivered",
  sports: "Sports and outdoors",
  automotive: "Automotive essentials",
  books: "Books for every shelf",
};

export function headlineFor(slug: string, name: string) {
  return (
    CATEGORY_HEADLINES[slug] ??
    DEPARTMENT_HEADLINES[slug] ??
    `Shop ${name.toLowerCase()}`
  );
}

export type ShelfTile = {
  label: string;
  image: string;
  href: string;
};

export type Shelf = {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
  tiles: ShelfTile[];
};

/** Slides for the hero carousel, chosen to span the catalog. */
export const HERO_SLIDES: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  from: string;
  to: string;
  categorySlug: string;
}[] = [
  {
    eyebrow: "Lightning deals",
    title: "Today's best prices, while they last",
    body: "Discounts up to 60% off, with a countdown on every one.",
    href: "/s?deals=1&sort=featured",
    cta: "Shop the deals",
    from: "#2f4a63",
    to: "#0d1520",
    categorySlug: "laptops",
  },
  {
    eyebrow: "Books",
    title: "Two and a half thousand titles, one shelf",
    body: "Fiction, history, cookbooks and more — real covers, real authors.",
    href: "/s?department=books",
    cta: "Browse books",
    from: "#3d2f5e",
    to: "#140d20",
    categorySlug: "fiction",
  },
  {
    eyebrow: "Free delivery over $35",
    title: "Kitchen must-haves for every cook",
    body: "From the everyday to the once-a-year, with a date before you buy.",
    href: "/s?department=home-kitchen",
    cta: "Shop the kitchen",
    from: "#1f4a45",
    to: "#0b1a18",
    categorySlug: "kitchen-accessories",
  },
  {
    eyebrow: "Express delivery",
    title: "Start looking sharp",
    body: "Shirts, shoes and watches that arrive in two days.",
    href: "/s?department=mens-fashion&prime=1",
    cta: "Shop men's fashion",
    from: "#4a3520",
    to: "#1a1109",
    categorySlug: "mens-shirts",
  },
];

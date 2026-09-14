/**
 * Seeds the Bazaar catalog.
 *
 *   npm run seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * .env.local. The service role key bypasses RLS, which is exactly why this
 * only ever runs from a terminal and never ships to the client.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

/** The 24 source categories grouped into the 8 departments the nav shows. */
const DEPARTMENTS = [
  {
    slug: "electronics",
    name: "Electronics",
    categories: ["laptops", "smartphones", "tablets", "mobile-accessories"],
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    categories: ["furniture", "home-decoration", "kitchen-accessories"],
  },
  {
    slug: "beauty",
    name: "Beauty & Personal Care",
    categories: ["beauty", "fragrances", "skin-care"],
  },
  {
    slug: "womens-fashion",
    name: "Women's Fashion",
    categories: [
      "womens-dresses",
      "womens-shoes",
      "womens-bags",
      "womens-jewellery",
      "womens-watches",
      "tops",
    ],
  },
  {
    slug: "mens-fashion",
    name: "Men's Fashion",
    categories: ["mens-shirts", "mens-shoes", "mens-watches", "sunglasses"],
  },
  {
    slug: "grocery",
    name: "Grocery",
    categories: ["groceries"],
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    categories: ["sports-accessories"],
  },
  {
    slug: "automotive",
    name: "Automotive",
    categories: ["vehicle", "motorcycle"],
  },
];

const departmentOf = new Map();
for (const dept of DEPARTMENTS) {
  for (const cat of dept.categories) departmentOf.set(cat, dept.slug);
}

/** Stable pseudo-random in [0,1) so re-seeding produces the same catalog. */
function hashUnit(str, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * "Ships in 1-2 business days" -> 2. Weeks and months are converted to days
 * so the product page can quote a real arrival date rather than a phrase.
 */
function shipDaysFrom(text) {
  if (!text) return 5;
  const lower = text.toLowerCase();
  if (lower.includes("overnight")) return 1;
  const numbers = lower.match(/\d+/g)?.map(Number) ?? [];
  const value = numbers.length ? Math.max(...numbers) : 5;
  if (lower.includes("month")) return value * 30;
  if (lower.includes("week")) return value * 7;
  return value;
}

function bulletsFor(p) {
  const out = [];
  if (p.brand) out.push(`Genuine ${p.brand} product, sold and shipped by Bazaar`);
  if (p.warrantyInformation) out.push(`Covered by a ${p.warrantyInformation.replace(/^\w/, (c) => c.toLowerCase())}`);
  if (p.returnPolicy && !/no return/i.test(p.returnPolicy)) {
    out.push(`${p.returnPolicy} — free returns, no questions asked`);
  }
  if (p.dimensions) {
    const { width, height, depth } = p.dimensions;
    out.push(`Measures ${width} × ${height} × ${depth} cm and weighs ${p.weight} kg`);
  }
  if (p.tags?.length) {
    out.push(`Ideal for ${p.tags.join(", ")}`);
  }
  return out.slice(0, 5);
}

const POSITIVE = [
  "Arrived two days early and the quality is noticeably better than the one it replaced. I have used it every day since and it still looks new.",
  "Exactly what the listing described. Packaging was tidy, nothing was damaged, and it worked straight out of the box.",
  "I went back and forth between this and something twice the price. No regrets — this one does everything I needed and then some.",
  "Bought a second one for my sister after a week with mine. That is the highest recommendation I can give.",
];
const NEUTRAL = [
  "Does the job. Nothing here is remarkable, but nothing is wrong either, and for the money that feels fair.",
  "Good product, slightly slower delivery than I expected. I would buy it again but I would order ahead of when I need it.",
  "Solid for everyday use. The finish is a little different from the photos, though not in a way that bothers me.",
];
const NEGATIVE = [
  "It works, but it feels flimsier than the pictures suggest. I doubt it survives a year of regular use.",
  "Mine arrived with a scuff on one side. Support sorted a replacement quickly, which is the only reason this is not one star.",
  "Not what I expected for the price. The description oversells it and I will probably return mine.",
];

function reviewBody(rating, seed) {
  const bank = rating >= 4 ? POSITIVE : rating === 3 ? NEUTRAL : NEGATIVE;
  return bank[Math.floor(hashUnit(seed, rating) * bank.length)];
}

async function main() {
  console.log("Fetching catalog…");
  const res = await fetch("https://dummyjson.com/products?limit=0");
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  const { products: source } = await res.json();
  console.log(`  ${source.length} products`);

  // ---------------------------------------------------------- departments --
  const deptRows = DEPARTMENTS.map((d, i) => ({
    slug: d.slug,
    name: d.name,
    sort: i,
  }));
  let { error } = await db.from("departments").upsert(deptRows);
  if (error) throw error;
  console.log(`  ${deptRows.length} departments`);

  // ------------------------------------------------------------ categories --
  const catRows = [];
  let catSort = 0;
  for (const dept of DEPARTMENTS) {
    for (const cat of dept.categories) {
      const first = source.find((p) => p.category === cat);
      catRows.push({
        slug: cat,
        name: cat
          .split("-")
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ")
          .replace(/^Mens /, "Men's ")
          .replace(/^Womens /, "Women's "),
        department_slug: dept.slug,
        image_url: first?.thumbnail ?? null,
        sort: catSort++,
      });
    }
  }
  ({ error } = await db.from("categories").upsert(catRows));
  if (error) throw error;
  console.log(`  ${catRows.length} categories`);

  // -------------------------------------------------------------- products --
  const seenSlugs = new Set();
  const productRows = source
    .filter((p) => departmentOf.has(p.category))
    .map((p) => {
      let slug = slugify(p.title);
      while (seenSlugs.has(slug)) slug = `${slug}-${p.id}`;
      seenSlugs.add(slug);

      const priceCents = Math.round(p.price * 100);
      const discount = p.discountPercentage ?? 0;
      // dummyjson's price is already discounted, so the struck-through list
      // price is the price grossed back up by the discount.
      const listCents =
        discount > 0
          ? Math.round(priceCents / (1 - discount / 100))
          : priceCents;
      const shipDays = shipDaysFrom(p.shippingInformation);

      return {
        slug,
        title: p.title,
        brand: p.brand ?? null,
        description: p.description,
        bullets: bulletsFor(p),
        category_slug: p.category,
        price_cents: priceCents,
        list_price_cents: listCents,
        rating: Math.round(p.rating * 10) / 10,
        rating_count: 40 + Math.floor(hashUnit(p.title, 7) * 2600),
        stock: p.stock,
        images: p.images?.length ? p.images : [p.thumbnail],
        tags: p.tags ?? [],
        ship_days: shipDays,
        is_prime: shipDays <= 2,
        return_policy: p.returnPolicy ?? null,
        warranty: p.warrantyInformation ?? null,
      };
    });

  ({ error } = await db
    .from("products")
    .upsert(productRows, { onConflict: "slug" }));
  if (error) throw error;
  console.log(`  ${productRows.length} products`);

  // --------------------------------------------------------------- reviews --
  const { data: saved, error: readErr } = await db
    .from("products")
    .select("id, slug, title, price_cents, images");
  if (readErr) throw readErr;
  const idBySlug = new Map(saved.map((r) => [r.slug, r.id]));

  await db.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const reviewRows = [];
  for (const p of source) {
    const slug = productRows.find((r) => r.title === p.title)?.slug;
    const productId = slug ? idBySlug.get(slug) : null;
    if (!productId) continue;
    for (const [i, r] of (p.reviews ?? []).entries()) {
      reviewRows.push({
        product_id: productId,
        author_name: r.reviewerName,
        rating: r.rating,
        title: r.comment?.replace(/[!.]$/, "") ?? "Review",
        body: reviewBody(r.rating, `${slug}-${i}`),
        verified: hashUnit(`${slug}-${i}`, 3) > 0.25,
        created_at: r.date,
      });
    }
  }

  for (let i = 0; i < reviewRows.length; i += 500) {
    const { error: revErr } = await db
      .from("reviews")
      .insert(reviewRows.slice(i, i + 500));
    if (revErr) throw revErr;
  }
  console.log(`  ${reviewRows.length} reviews`);

  await seedDemoShopper(saved);

  console.log("Seed complete.");
}

// Must match src/lib/demo.ts, which the sign-in button reads.
const DEMO_EMAIL = "demo@bazaar.shop";
const DEMO_PASSWORD = "demo-shopper-2024";

/**
 * A ready-made account so anyone evaluating the storefront lands on a filled
 * order history instead of an empty state. Idempotent: re-seeding reuses the
 * same user and replaces its orders.
 */
async function seedDemoShopper(products) {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  let user = list?.users?.find((u) => u.email === DEMO_EMAIL);

  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Dana Reyes" },
    });
    if (error) throw error;
    user = data.user;
  }

  await db.from("profiles").upsert({ id: user.id, full_name: "Dana Reyes" });

  await db.from("addresses").delete().eq("user_id", user.id);
  const { data: address, error: addressError } = await db
    .from("addresses")
    .insert({
      user_id: user.id,
      full_name: "Dana Reyes",
      line1: "1412 Marion Street",
      line2: "Apt 5B",
      city: "Seattle",
      state: "WA",
      postal_code: "98101",
      country: "United States",
      phone: "(206) 555-0182",
      is_default: true,
    })
    .select()
    .single();
  if (addressError) throw addressError;

  await db.from("orders").delete().eq("user_id", user.id);

  // Two orders at different ages, so the tracking strip shows a delivered
  // order and one still in flight.
  const plans = [
    { daysAgo: 9, etaOffset: -4, picks: 3 },
    { daysAgo: 1, etaOffset: 3, picks: 2 },
  ];

  const pool = products.filter((p) => p.images?.length);

  for (const [index, plan] of plans.entries()) {
    const picks = [];
    for (let i = 0; i < plan.picks; i++) {
      picks.push(pool[Math.floor(hashUnit(`demo-${index}-${i}`, 11) * pool.length)]);
    }

    const lines = picks.map((p, i) => ({
      product: p,
      qty: 1 + Math.floor(hashUnit(`qty-${index}-${i}`, 5) * 2),
    }));

    const subtotal = lines.reduce(
      (sum, l) => sum + l.product.price_cents * l.qty,
      0,
    );
    const shipping = subtotal >= 3500 ? 0 : 499;
    const tax = Math.round(subtotal * 0.0825);

    const placedAt = new Date();
    placedAt.setDate(placedAt.getDate() - plan.daysAgo);
    const eta = new Date();
    eta.setDate(eta.getDate() + plan.etaOffset);

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        tax_cents: tax,
        total_cents: subtotal + shipping + tax,
        ship_to: address,
        payment_last4: "4242",
        payment_brand: "Visa",
        delivery_speed: "standard",
        eta_date: eta.toISOString().slice(0, 10),
        placed_at: placedAt.toISOString(),
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await db.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        title: l.product.title,
        slug: l.product.slug,
        image_url: l.product.images[0],
        unit_price_cents: l.product.price_cents,
        qty: l.qty,
      })),
    );
    if (itemsError) throw itemsError;
  }

  console.log(`  demo shopper ${DEMO_EMAIL} with ${plans.length} orders`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});

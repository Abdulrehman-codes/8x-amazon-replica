export type Department = {
  slug: string;
  name: string;
  sort: number;
};

export type Category = {
  slug: string;
  name: string;
  department_slug: string;
  image_url: string | null;
  sort: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  description: string;
  bullets: string[];
  category_slug: string;
  price_cents: number;
  list_price_cents: number;
  rating: number;
  rating_count: number;
  stock: number;
  images: string[];
  tags: string[];
  ship_days: number;
  is_prime: boolean;
  return_policy: string | null;
  warranty: string | null;
};

export type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  created_at: string;
};

export type CartLine = {
  id: string;
  qty: number;
  saved_for_later: boolean;
  product: Product;
};

export type Address = {
  id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  title: string;
  slug: string;
  image_url: string | null;
  unit_price_cents: number;
  qty: number;
};

export type Order = {
  id: string;
  status: "placed" | "preparing" | "shipped" | "out_for_delivery" | "delivered";
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  /** Present once supabase/coupons.sql has been applied. */
  discount_cents?: number;
  coupon_code?: string | null;
  total_cents: number;
  ship_to: Address;
  payment_last4: string;
  payment_brand: string;
  delivery_speed: string;
  eta_date: string;
  placed_at: string;
  order_items: OrderItem[];
};

export type DeliverySpeed = "standard" | "express" | "sameday";

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

/**
 * Shared domain types used across client and server.
 *
 * These mirror the prototype's `data.js` / `store.jsx` shapes and the Firestore
 * model in the build plan. Keep them in one place so the cart, catalogue, and
 * (later) order/checkout code all agree on the same contracts.
 */

/** A product category, e.g. "Fresh Fruits". */
export interface Category {
  /** Stable id; also used as the URL slug in this phase. */
  id: string;
  name: string;
  blurb: string;
  /** Soft background tint used by placeholder image tiles. */
  tint: string;
  /** Foreground ink colour paired with `tint`. */
  ink: string;
}

/** A catalogue product. */
export interface Product {
  id: string;
  /** Owning category id (see {@link Category.id}). */
  cat: string;
  name: string;
  price: number;
  unit: string;
  /** Maximum retail price; `null` when there is no strike-through price. */
  mrp: number | null;
  rating: number;
  reviews: number;
  /** Short marketing badge, e.g. "Bestseller"; `null` when none. */
  tag: string | null;
  /** Long description; `null` when none. */
  desc: string | null;
  stock: boolean;
}

/** A saved delivery address. */
export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  pin: string;
  type: 'home' | 'work' | 'other';
  /** Whether this is the user's default address. */
  def: boolean;
}

/** A cart line: a product plus its quantity. */
export interface CartItem {
  product: Product;
  qty: number;
}

/** A signed-in user's profile (auth shell — fleshed out in Sprint 2). */
export interface User {
  name: string;
  email: string;
  phone?: string;
}

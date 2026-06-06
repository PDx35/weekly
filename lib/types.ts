/**
 * Shared domain types used across client and server.
 *
 * These mirror the prototype's `data.js` / `store.jsx` shapes and the Firestore
 * model in the build plan. Keep them in one place so the cart, catalogue, and
 * (later) order/checkout code all agree on the same contracts.
 */

/** A product category, e.g. "Fresh Fruits". */
export interface Category {
  /** Stable id (also the category's URL slug). */
  id: string;
  /** URL slug. Equal to {@link Category.id}. */
  slug: string;
  name: string;
  blurb: string;
  /** Soft background tint used by placeholder image tiles. */
  tint: string;
  /** Foreground ink colour paired with `tint`. */
  ink: string;
  /** Display order; preserves the curated category sequence. */
  order: number;
  /** Category icon image URL (from the DB), if any. */
  iconUrl?: string | null;
}

/** A catalogue product. */
export interface Product {
  id: string;
  /** SEO-friendly URL slug derived from the name, e.g. "alphonso-mango". */
  slug: string;
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
  /**
   * Lowercase search tokens (from the product and category names). Mirrors the
   * Firestore `array-contains` search field so the query layer can swap to a
   * real backend without changing callers.
   */
  searchTokens: string[];
  /** Product image URLs (empty → render a tinted placeholder tile). */
  images: string[];
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

/** A signed-in user's profile, mirroring the `users/{uid}` doc. */
export interface User {
  /** Firebase Auth uid. */
  uid: string;
  name: string;
  email: string;
  phone: string;
  /** Profile photo URL (e.g. from Google), or `null`. */
  photoUrl: string | null;
}

/** A line item snapshotted onto an order (price frozen at purchase time). */
export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

/** The computed bill for a cart/order. */
export interface OrderTotals {
  /** Item subtotal. */
  items: number;
  delivery: number;
  handling: number;
  discount: number;
  /** Final amount to pay. */
  grand: number;
}

/**
 * Order lifecycle status. `pending` is a placed-but-unpaid online order awaiting
 * payment verification; it advances to `confirmed` once paid.
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/** Payment details on an order. */
export interface OrderPayment {
  /** Method id: 'cod' | 'upi' | 'card' | 'wallet' | 'netbank'. */
  method: string;
  /** Display label, e.g. "UPI" or "Cash on Delivery". */
  label: string;
  /** 'pending_cod' | 'created' | 'paid' | 'failed'. */
  status: string;
  /** Razorpay order id (online payments). */
  razorpayOrderId?: string;
  /** Razorpay payment id, set after verification. */
  razorpayPaymentId?: string;
}

/** A placed order (written server-side). */
export interface Order {
  id: string;
  uid: string;
  items: OrderItem[];
  /** Snapshot of the delivery address at purchase time. */
  address: Address;
  payment: OrderPayment;
  totals: OrderTotals;
  /** Chosen delivery slot label. */
  slot: string;
  status: OrderStatus;
  /** Epoch millis when placed. */
  placedAt: number;
  /** Estimated delivery time in minutes. */
  eta: number;
}

/** A customer support ticket. */
export interface SupportTicket {
  /** Generated display id, e.g. "SR48213". */
  ticketId: string;
  /** Owner uid, or `null` for a guest. */
  uid: string | null;
  topic: string;
  /** Optional related order id. */
  orderId: string;
  message: string;
  status: 'open' | 'resolved';
}

/**
 * A stop on the travelling weekly market ("haat"). The market visits a fixed
 * place on one or more weekdays each week; orders delivered to that pincode on
 * those days get a market discount. Managed from the admin panel.
 */
export interface MarketDay {
  /** Weekdays the market is at this stop: 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Delivery pincode covered by this stop. */
  zip: string;
  /** Human-readable area name, e.g. "Indiranagar". */
  area: string;
  /** Stop centre — longitude. */
  lng: number;
  /** Stop centre — latitude. */
  lat: number;
  /** Discount percentage applied in this zip on this day (e.g. 15 = 15% off). */
  discountPercent: number;
}

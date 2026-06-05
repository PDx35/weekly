/**
 * Admin-panel entity types, matching the live Firestore schema in
 * docs/current_db.md (so the panel interoperates with the existing apps).
 */

export interface AdminCategory {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  homeIconUrl?: string;
  browseIconUrl?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  /** Owning category doc id (e.g. "Grocery100"). */
  category: string;
  description?: string;
  /** MRP / list price. */
  price: number;
  /** Selling price when discounted (0/absent = sell at `price`). */
  discountPrice?: number;
  unit?: string;
  stock: number;
  isAvailable: boolean;
  imageUrls: string[];
  weight?: number;
  pieces?: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  /** Rupees (flat) or percentage (percent). */
  discount: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

export interface AdminMarketStop {
  id: string;
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
  zip: string;
  area: string;
  lng: number;
  lat: number;
  discountPercent: number;
}

export interface AdminTicket {
  id: string;
  ticketId?: string;
  uid: string | null;
  topic: string;
  orderId?: string;
  message: string;
  status: 'open' | 'resolved';
}

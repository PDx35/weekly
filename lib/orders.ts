/**
 * Order helpers + client-side reads.
 *
 * Orders are user-specific and dynamic, so they're read on the client with the
 * web SDK, filtered by uid (rules enforce that a user sees only their own).
 */
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Order, OrderStatus } from '@/lib/types';

/** Relative time label, e.g. "3 hr ago". Ported from the prototype `timeAgo`. */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

/** Map an order status to the tracking stage index (0–3). */
export function stageFromStatus(status: OrderStatus): number {
  switch (status) {
    case 'packed':
      return 1;
    case 'out_for_delivery':
      return 2;
    case 'delivered':
      return 3;
    default:
      // 'pending' | 'confirmed' | 'cancelled'
      return 0;
  }
}

/** Fetch the signed-in user's orders, newest first. */
export async function fetchUserOrders(uid: string): Promise<Order[]> {
  // Filter by uid only (no composite index needed); sort client-side.
  const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', uid)));
  const orders = snap.docs.map((d) => d.data() as Order);
  return orders.sort((a, b) => b.placedAt - a.placedAt);
}

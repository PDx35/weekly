/**
 * Bill computation — the single source of truth for order totals.
 *
 * Ported verbatim from the prototype `computeBill`. This exact logic runs on the
 * client (for display) and on the server (for the authoritative total), so the
 * two can never disagree. The server recomputes from catalogue prices and
 * rejects any client total that doesn't match.
 */
import type { OrderTotals } from './types';

/** Free delivery at/above this subtotal; flat fee below it. */
export const FREE_DELIVERY_THRESHOLD = 199;
const DELIVERY_FEE = 25;
const HANDLING_FEE = 0;

/** Compute the full bill from a subtotal and an optional discount. */
export function computeBill(subtotal: number, discount = 0): OrderTotals {
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const handling = subtotal === 0 ? 0 : HANDLING_FEE;
  const grand = Math.max(0, subtotal + delivery + handling - discount);
  return { items: subtotal, delivery, handling, discount, grand };
}

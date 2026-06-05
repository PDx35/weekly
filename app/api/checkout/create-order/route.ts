/**
 * Create-order route — the ONLY writer of orders and totals.
 *
 * Flow: verify the caller's Firebase ID token → recompute the bill from
 * authoritative catalogue prices (never trusting the client) → validate the
 * coupon server-side → for COD, write a confirmed order, snapshot the address +
 * item prices, clear the server cart, and return the order id. Online methods
 * return the computed amount only (Razorpay is wired in Sprint 4).
 *
 * Requires a Firebase Admin service account; returns 503 until it's configured.
 */
import { NextResponse } from 'next/server';
import { computeBill } from '@/lib/bill';
import { validateCoupon } from '@/lib/coupons';
import { getAdminAuth, getAdminDb, isAdminConfigured } from '@/lib/firebase/admin';
import { getProductById } from '@/lib/queries';
import type { Address, OrderItem } from '@/lib/types';

interface CreateOrderBody {
  items?: { id: string; qty: number }[];
  addressId?: string;
  slot?: string;
  coupon?: string;
  method?: string;
  /** Client's displayed total — checked against the server total, never trusted. */
  clientTotal?: number;
}

const ONLINE_METHODS = new Set(['upi', 'card', 'wallet', 'netbank']);

/** Order id in the prototype's format, e.g. "FM103421". */
function newOrderId(): string {
  return 'FM' + String(Date.now()).slice(-6);
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Order placement is not configured yet (Firebase Admin service account missing).' },
      { status: 503 },
    );
  }

  // 1. Authenticate the caller.
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateOrderBody;
  const items = body.items ?? [];
  const method = body.method ?? '';
  if (items.length === 0)
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  if (method !== 'cod' && !ONLINE_METHODS.has(method)) {
    return NextResponse.json({ error: 'Unknown payment method.' }, { status: 400 });
  }

  // 2. Recompute the bill from authoritative catalogue prices.
  const lineItems: OrderItem[] = [];
  let subtotal = 0;
  for (const line of items) {
    const qty = Math.floor(Number(line.qty));
    if (!line.id || !Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Invalid cart item.' }, { status: 400 });
    }
    const product = await getProductById(line.id);
    if (!product || !product.stock) {
      return NextResponse.json(
        { error: `${product?.name ?? 'An item'} is out of stock.` },
        { status: 409 },
      );
    }
    subtotal += product.price * qty;
    lineItems.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      qty,
    });
  }

  // 3. Validate the coupon server-side.
  const coupon = body.coupon ? validateCoupon(body.coupon, subtotal) : null;
  const discount = coupon?.ok ? coupon.discount : 0;
  const totals = computeBill(subtotal, discount);

  // 4. Reject a tampered client total.
  if (body.clientTotal != null && Math.round(body.clientTotal) !== totals.grand) {
    return NextResponse.json(
      { error: 'Cart total changed. Please review your order and try again.' },
      { status: 409 },
    );
  }

  const adminDb = getAdminDb();

  // 5. Snapshot the chosen address from the user doc.
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};
  const stored = (userData.addresses as Omit<Address, 'def'>[] | undefined) ?? [];
  const chosen = stored.find((a) => a.id === body.addressId);
  if (!chosen) {
    return NextResponse.json({ error: 'Select a delivery address.' }, { status: 400 });
  }
  const address: Address = { ...chosen, def: chosen.id === userData.defaultAddressId };

  // 6. Online methods: return the computed amount only (Razorpay in Sprint 4).
  if (method !== 'cod') {
    return NextResponse.json({ online: true, amount: totals.grand, totals });
  }

  // 7. COD: write the confirmed order (server is the only writer), clear cart.
  const orderId = newOrderId();
  const placedAt = Date.now();
  await adminDb
    .collection('orders')
    .doc(orderId)
    .set({
      id: orderId,
      uid,
      items: lineItems,
      address,
      payment: { method: 'cod', label: 'Cash on Delivery', status: 'pending_cod' },
      totals,
      slot: body.slot ?? '',
      status: 'confirmed',
      statusHistory: [{ status: 'confirmed', at: placedAt }],
      placedAt,
      eta: 32,
    });
  await adminDb.collection('users').doc(uid).set({ cart: {} }, { merge: true });

  return NextResponse.json({ orderId });
}

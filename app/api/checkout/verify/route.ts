/**
 * Payment verification route.
 *
 * The client posts the Razorpay Checkout result here after a successful payment.
 * The server verifies the signature (never trusting the client's "success"),
 * and only then marks the order paid + confirmed and clears the cart. An invalid
 * signature leaves the order pending so the user can retry.
 */
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb, isAdminConfigured } from '@/lib/firebase/admin';
import { isRazorpayConfigured, verifyPaymentSignature } from '@/lib/razorpay';
import type { Order } from '@/lib/types';

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  freshmartOrderId?: string;
}

export async function POST(request: Request) {
  if (!isAdminConfigured() || !isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, freshmartOrderId } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !freshmartOrderId) {
    return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  const ref = adminDb.collection('orders').doc(freshmartOrderId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const order = snap.data() as Order;
  if (order.uid !== uid) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  // Idempotent: already verified.
  if (order.payment.status === 'paid') {
    return NextResponse.json({ orderId: freshmartOrderId });
  }

  if (order.payment.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: 'Order mismatch.' }, { status: 400 });
  }

  // Authoritative check — never trust the client's claim of success.
  const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  const at = Date.now();
  await ref.update({
    status: 'confirmed',
    'payment.status': 'paid',
    'payment.razorpayPaymentId': razorpay_payment_id,
    statusHistory: FieldValue.arrayUnion({ status: 'confirmed', at }),
  });
  await adminDb.collection('users').doc(uid).set({ cart: {} }, { merge: true });

  return NextResponse.json({ orderId: freshmartOrderId });
}

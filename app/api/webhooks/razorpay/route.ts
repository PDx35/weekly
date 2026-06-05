/**
 * Razorpay webhook — server-to-server payment backstop.
 *
 * Confirms payment even if the browser closes before client verification. The
 * raw body is verified against RAZORPAY_WEBHOOK_SECRET, then the matching order
 * is marked paid if it isn't already. Idempotent: replays are no-ops.
 *
 * Configure the endpoint URL + secret in the Razorpay dashboard.
 */
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, isAdminConfigured } from '@/lib/firebase/admin';
import { verifyWebhookSignature } from '@/lib/razorpay';

interface RzpEntity {
  id?: string;
  order_id?: string;
}
interface RzpWebhook {
  event?: string;
  payload?: {
    payment?: { entity?: RzpEntity };
    order?: { entity?: RzpEntity };
  };
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let event: RzpWebhook;
  try {
    event = JSON.parse(raw) as RzpWebhook;
  } catch {
    return NextResponse.json({ error: 'Bad payload.' }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  const paymentId = payment?.id;

  // Acknowledge events we don't act on so Razorpay doesn't retry.
  if (!razorpayOrderId) return NextResponse.json({ received: true });

  const adminDb = getAdminDb();
  const matches = await adminDb
    .collection('orders')
    .where('payment.razorpayOrderId', '==', razorpayOrderId)
    .limit(1)
    .get();
  if (matches.empty) return NextResponse.json({ received: true });

  const docRef = matches.docs[0].ref;
  const order = matches.docs[0].data();
  if (order.payment?.status !== 'paid') {
    await docRef.update({
      status: 'confirmed',
      'payment.status': 'paid',
      ...(paymentId ? { 'payment.razorpayPaymentId': paymentId } : {}),
      statusHistory: FieldValue.arrayUnion({ status: 'confirmed', at: Date.now() }),
    });
    await adminDb
      .collection('users')
      .doc(order.uid as string)
      .set({ cart: {} }, { merge: true });
  }

  return NextResponse.json({ received: true });
}

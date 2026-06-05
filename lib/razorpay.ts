/**
 * Razorpay server helper (SERVER ONLY).
 *
 * Uses the Razorpay REST API over fetch (no SDK dependency) to create orders,
 * and Node crypto to verify payment + webhook signatures. The key secret and
 * webhook secret never leave the server; only the public key id is exposed to
 * the browser (via the create-order response / NEXT_PUBLIC_*).
 *
 * Returns gracefully via {@link isRazorpayConfigured} so the app builds and
 * runs before test-mode keys are added.
 */
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function keyId(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}
function keySecret(): string | undefined {
  return process.env.RAZORPAY_KEY_SECRET;
}
function webhookSecret(): string | undefined {
  return process.env.RAZORPAY_WEBHOOK_SECRET;
}

/** Whether Razorpay key id + secret are configured. */
export function isRazorpayConfigured(): boolean {
  return Boolean(keyId() && keySecret());
}

/** The public Razorpay key id (safe to send to the client). */
export function getRazorpayKeyId(): string {
  const id = keyId();
  if (!id) throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set.');
  return id;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Create a Razorpay order.
 * @param amountPaise Amount in the smallest currency unit (paise).
 * @param receipt Your internal order id, for reconciliation.
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
): Promise<RazorpayOrder> {
  const id = keyId();
  const secret = keySecret();
  if (!id || !secret) throw new Error('Razorpay is not configured.');

  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Razorpay order creation failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Constant-time comparison of two hex digests. */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify the Razorpay payment signature: HMAC-SHA256 of `${orderId}|${paymentId}`
 * keyed by the key secret, compared to the signature returned by Checkout.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = keySecret();
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * Verify a Razorpay webhook signature: HMAC-SHA256 of the raw request body keyed
 * by the webhook secret.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = webhookSecret();
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * Coupon validation API — backs the cart's coupon input.
 *
 * `GET /api/checkout/coupon?code=SAVE10&subtotal=250` → { ok, code, discount,
 * message }. Validation is server-authoritative (see lib/coupons); the cart only
 * displays the discount, and the create-order route re-validates independently.
 */
import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') ?? '';
  const subtotal = Number(searchParams.get('subtotal')) || 0;
  return NextResponse.json(validateCoupon(code, subtotal));
}

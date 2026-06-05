/**
 * Coupon definitions + server-side validation.
 *
 * Seeded with `SAVE10` (matching the live `coupons` collection in
 * docs/current_db.md) plus the prototype's flat codes. The admin panel will
 * manage these in Firestore later; validation stays server-authoritative so a
 * client can never invent a discount.
 */

export interface Coupon {
  code: string;
  type: 'flat' | 'percent';
  /** Rupees for `flat`, percentage for `percent`. */
  value: number;
  /** Minimum item subtotal required (rupees). */
  minSubtotal: number;
}

const COUPONS: Record<string, Coupon> = {
  SAVE10: { code: 'SAVE10', type: 'percent', value: 10, minSubtotal: 100 },
  FRESH40: { code: 'FRESH40', type: 'flat', value: 40, minSubtotal: 0 },
  FIRST50: { code: 'FIRST50', type: 'flat', value: 50, minSubtotal: 199 },
};

export interface CouponResult {
  ok: boolean;
  /** Normalised coupon code (uppercased) when valid. */
  code: string;
  /** Discount in rupees to apply (0 when invalid). */
  discount: number;
  /** Human-readable status message. */
  message: string;
}

/** Validate a coupon code against a subtotal and return the rupee discount. */
export function validateCoupon(rawCode: string, subtotal: number): CouponResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, code: '', discount: 0, message: 'Enter a coupon code' };

  const coupon = COUPONS[code];
  if (!coupon) return { ok: false, code, discount: 0, message: 'Invalid coupon code' };

  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      code,
      discount: 0,
      message: `Add ₹${coupon.minSubtotal - subtotal} more to use ${code}`,
    };
  }

  const discount =
    coupon.type === 'flat'
      ? Math.min(coupon.value, subtotal)
      : Math.round((subtotal * coupon.value) / 100);

  const label = coupon.type === 'flat' ? `₹${discount} off` : `${coupon.value}% off`;
  return { ok: true, code, discount, message: `Coupon ${code} applied — ${label}` };
}

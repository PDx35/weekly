import { describe, expect, it } from 'vitest';
import { validateCoupon } from '../../lib/coupons';

describe('validateCoupon', () => {
  it('applies a percent coupon above its minimum', () => {
    const r = validateCoupon('SAVE10', 250);
    expect(r).toMatchObject({ ok: true, code: 'SAVE10', discount: 25 });
  });

  it('rejects a percent coupon below its minimum subtotal', () => {
    const r = validateCoupon('SAVE10', 50);
    expect(r.ok).toBe(false);
    expect(r.discount).toBe(0);
    expect(r.message).toContain('more to use SAVE10');
  });

  it('applies a flat coupon', () => {
    expect(validateCoupon('FRESH40', 100)).toMatchObject({ ok: true, discount: 40 });
  });

  it('caps a flat coupon at the subtotal', () => {
    expect(validateCoupon('FRESH40', 20)).toMatchObject({ ok: true, discount: 20 });
  });

  it('enforces a flat coupon minimum subtotal', () => {
    expect(validateCoupon('FIRST50', 150).ok).toBe(false);
    expect(validateCoupon('FIRST50', 199)).toMatchObject({ ok: true, discount: 50 });
  });

  it('normalises case', () => {
    expect(validateCoupon('save10', 250)).toMatchObject({ ok: true, code: 'SAVE10', discount: 25 });
  });

  it('rejects unknown and empty codes', () => {
    expect(validateCoupon('NOPE', 250).ok).toBe(false);
    expect(validateCoupon('  ', 250).ok).toBe(false);
  });
});

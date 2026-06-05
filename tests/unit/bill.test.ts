import { describe, expect, it } from 'vitest';
import { computeBill } from '../../lib/bill';

describe('computeBill', () => {
  it('is all-zero for an empty cart', () => {
    expect(computeBill(0)).toEqual({ items: 0, delivery: 0, handling: 0, discount: 0, grand: 0 });
  });

  it('charges delivery + handling below the free-delivery threshold', () => {
    expect(computeBill(100)).toEqual({
      items: 100,
      delivery: 25,
      handling: 9,
      discount: 0,
      grand: 134,
    });
  });

  it('gives free delivery exactly at the threshold (199)', () => {
    expect(computeBill(199)).toEqual({
      items: 199,
      delivery: 0,
      handling: 9,
      discount: 0,
      grand: 208,
    });
  });

  it('gives free delivery above the threshold', () => {
    expect(computeBill(250)).toEqual({
      items: 250,
      delivery: 0,
      handling: 9,
      discount: 0,
      grand: 259,
    });
  });

  it('subtracts the discount from the grand total', () => {
    expect(computeBill(250, 25)).toMatchObject({ discount: 25, grand: 234 });
  });

  it('still charges delivery when a sub-threshold cart has a discount', () => {
    expect(computeBill(150, 20)).toEqual({
      items: 150,
      delivery: 25,
      handling: 9,
      discount: 20,
      grand: 164,
    });
  });

  it('never returns a negative grand total', () => {
    // 50 + 25 delivery + 9 handling = 84; a 100 discount clamps to 0.
    expect(computeBill(50, 100).grand).toBe(0);
  });
});

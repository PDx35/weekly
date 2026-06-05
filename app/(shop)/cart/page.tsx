'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BillRows } from '@/components/cart/BillRows';
import { Button } from '@/components/ui/Button';
import { Crumbs } from '@/components/ui/Crumbs';
import { Empty } from '@/components/ui/Empty';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { Price, rupee } from '@/components/ui/Price';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { computeBill } from '@/lib/bill';
import type { CouponResult } from '@/lib/coupons';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartCount, cartSubtotal, setQty, removeFromCart, showToast } = useCart();
  const { addresses, selectedAddr } = useAuth();
  const [promo, setPromo] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);

  const validate = async (code: string, subtotal: number): Promise<CouponResult> => {
    const res = await fetch(
      `/api/checkout/coupon?code=${encodeURIComponent(code)}&subtotal=${subtotal}`,
    );
    return (await res.json()) as CouponResult;
  };

  const applyPromo = async () => {
    if (!promo.trim()) return;
    const result = await validate(promo, cartSubtotal);
    setCoupon(result.ok ? result : null);
    showToast(result.message);
  };

  // Re-validate an applied coupon when the subtotal changes (qty/remove).
  useEffect(() => {
    if (!coupon?.ok) return;
    let active = true;
    validate(coupon.code, cartSubtotal).then((result) => {
      if (active) setCoupon(result.ok ? result : null);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal]);

  const bill = computeBill(cartSubtotal, coupon?.ok ? coupon.discount : 0);
  const activeAddr = addresses.find((a) => a.id === selectedAddr) ?? addresses[0];

  if (cartItems.length === 0) {
    return (
      <div className="page cart">
        <h1 className="page-title">Your cart</h1>
        <Empty
          icon="cart"
          title="Your cart is empty"
          sub="Add some fresh picks and they'll show up here."
        >
          <Link className="btn btn-primary btn-md" href={routes.browse()}>
            <span>Start shopping</span>
            <Icon name="arrowR" size={18} />
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page cart">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'Cart' }]} />
      <h1 className="page-title">
        Your cart <span className="muted">· {cartCount} items</span>
      </h1>

      <div className="checkout-grid">
        <div className="checkout-main">
          <div className="cart-savings">
            <Icon name="bolt" size={16} /> Delivery in 30 minutes
            {activeAddr ? (
              <>
                {' '}
                to <b>{activeAddr.label}</b>
              </>
            ) : null}
          </div>

          <div className="cart-list">
            {cartItems.map(({ product, qty }) => (
              <div className="cart-row" key={product.id}>
                <button
                  className="cart-thumb"
                  onClick={() => router.push(routes.product(product.slug))}
                  aria-label={product.name}
                >
                  <Img product={product} ratio="1 / 1" radius="12px" />
                </button>
                <div className="cart-meta">
                  <button
                    className="cart-name"
                    onClick={() => router.push(routes.product(product.slug))}
                  >
                    {product.name}
                  </button>
                  <span className="cart-unit">{product.unit}</span>
                  <Price value={product.price} mrp={product.mrp} size="sm" />
                </div>
                <div className="cart-actions">
                  <QtyStepper qty={qty} size="sm" onChange={(q) => setQty(product.id, q)} />
                  <button
                    className="cart-del"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                <div className="cart-line">{rupee(product.price * qty)}</div>
              </div>
            ))}
          </div>

          <div className="promo-box">
            <Icon name="tag" size={18} />
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
              placeholder="Coupon code (try SAVE10)"
            />
            <button onClick={applyPromo}>Apply</button>
          </div>
        </div>

        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Bill details</h3>
            <BillRows bill={bill} freeNote />
            <Button
              size="lg"
              full
              iconRight="arrowR"
              onClick={() => router.push(routes.checkout())}
            >
              Proceed to checkout
            </Button>
            <p className="safe-note">
              <Icon name="shield" size={14} /> Safe &amp; secure payments
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

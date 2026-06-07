'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { routes } from '@/lib/routes';
import type { Product } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

/** Quantity stepper + add-to-cart / go-to-cart action for the product page. */
export function ProductBuy({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, setQty, addToCart } = useCart();
  const qty = cart[product.id] || 0;

  return (
    <div className="pd-buy">
      <QtyStepper qty={qty} onChange={(q) => setQty(product.id, q)} />
      <Button
        size="lg"
        full
        icon="cart"
        onClick={() => {
          if (!user) {
            addToCart(product.id);
            return;
          }
          if (!qty) addToCart(product.id);
          router.push(routes.cart());
        }}
      >
        {qty ? 'Go to cart' : 'Add to cart'}
      </Button>
    </div>
  );
}

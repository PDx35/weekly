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
  const { cart, setQty, addToCart, showToast } = useCart();
  const qty = cart[product.id] || 0;

  const isAvailable = product.stock && product.inventory > 0;

  const handleQtyChange = (q: number) => {
    if (q > product.inventory) {
      showToast(`Only ${product.inventory} units of ${product.name} are available.`);
      return;
    }
    setQty(product.id, q);
  };

  if (!isAvailable) {
    return (
      <div className="pd-buy">
        <Button size="lg" full disabled className="bg-neutral-100 text-neutral-450 border border-neutral-200">
          Out of Stock
        </Button>
      </div>
    );
  }

  return (
    <div className="pd-buy">
      <QtyStepper qty={qty} onChange={handleQtyChange} />
      <Button
        size="lg"
        full
        icon="cart"
        onClick={() => {
          if (!qty) {
            handleQtyChange(1);
          } else {
            router.push(routes.cart());
          }
        }}
      >
        {qty ? 'Go to cart' : 'Add to cart'}
      </Button>
    </div>
  );
}

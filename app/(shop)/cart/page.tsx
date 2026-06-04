import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Your cart' };

export default function CartPage() {
  return (
    <Placeholder
      title="Cart"
      icon="cart"
      heading="Your cart is taking shape"
      sub="Quantity controls, coupons, and the live bill arrive in Sprint 3."
    />
  );
}

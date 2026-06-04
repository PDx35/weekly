import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return (
    <Placeholder
      title="Checkout"
      icon="shield"
      heading="Secure checkout is coming"
      sub="Address, delivery slot, and payment selection arrive in Sprint 3."
    />
  );
}

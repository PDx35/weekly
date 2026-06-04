import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Your orders' };

export default function OrdersPage() {
  return (
    <Placeholder
      title="Orders"
      icon="receipt"
      heading="Order history is on the way"
      sub="Past orders, tracking, and invoices arrive in Sprint 5."
    />
  );
}

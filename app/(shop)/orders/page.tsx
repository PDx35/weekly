import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';
import { RequireAuth } from '@/components/auth/RequireAuth';

export const metadata: Metadata = { title: 'Your orders' };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Placeholder
        title="Orders"
        icon="receipt"
        heading="Order history is on the way"
        sub="Past orders, tracking, and invoices arrive in Sprint 5."
      />
    </RequireAuth>
  );
}

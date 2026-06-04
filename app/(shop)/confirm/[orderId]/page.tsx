import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Order confirmed' };

interface ConfirmPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { orderId } = await params;
  return (
    <Placeholder
      title={`Order ${orderId}`}
      icon="check"
      heading="Order confirmation is coming"
      sub="The confirmation and tracking screen arrives in Sprint 4."
    />
  );
}

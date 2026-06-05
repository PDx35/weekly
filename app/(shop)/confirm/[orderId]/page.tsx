import type { Metadata } from 'next';
import { ConfirmScreen } from '@/components/checkout/ConfirmScreen';

export const metadata: Metadata = { title: 'Order confirmed' };

interface ConfirmPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { orderId } = await params;
  return <ConfirmScreen orderId={orderId} />;
}

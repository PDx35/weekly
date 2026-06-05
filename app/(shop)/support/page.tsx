import type { Metadata } from 'next';
import { SupportScreen } from '@/components/support/SupportScreen';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with FreshMart orders, refunds, payments, and more.',
};

export default function SupportPage() {
  return <SupportScreen />;
}

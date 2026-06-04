import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Support' };

export default function SupportPage() {
  return (
    <Placeholder
      title="Support"
      icon="info"
      heading="The support centre is coming"
      sub="FAQ and a ticket form arrive in Sprint 5."
    />
  );
}

import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Saved addresses' };

export default function AddressesPage() {
  return (
    <Placeholder
      title="Addresses"
      icon="pin"
      heading="Address management is coming"
      sub="Add, edit, and set a default delivery address in Sprint 2."
    />
  );
}

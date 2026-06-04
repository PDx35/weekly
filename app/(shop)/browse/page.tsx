import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Browse categories' };

export default function BrowsePage() {
  return (
    <Placeholder
      title="Browse"
      icon="grid"
      heading="Category browsing is on the way"
      sub="The full browse experience — a rail per category — arrives in Sprint 1."
    />
  );
}

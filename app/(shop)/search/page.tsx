import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';

export const metadata: Metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <Placeholder
      title="Search"
      icon="search"
      heading="Search results are coming soon"
      sub="Live search by product name and category lands in Sprint 1."
    />
  );
}

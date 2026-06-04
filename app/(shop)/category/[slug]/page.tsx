import type { Metadata } from 'next';
import { Placeholder } from '@/components/Placeholder';
import { catById } from '@/lib/data';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = catById(slug);
  return { title: category ? category.name : 'Category' };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = catById(slug);
  return (
    <Placeholder
      title={category ? category.name : 'Category'}
      icon="grid"
      heading={category ? category.blurb : 'Category coming soon'}
      sub="Category pages with sort, filter, and a product grid arrive in Sprint 1."
    />
  );
}

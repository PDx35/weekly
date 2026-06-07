import type { Metadata } from 'next';
import { CategoryBrowser } from '@/components/catalogue/CategoryBrowser';
import { getCategories, getProductsByCategory } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories',
  description:
    'Browse every category — fresh fruits, vegetables, dairy, bakery, staples and more.',
};

/** Browse page: premium sidebar category selector + product browser grid. */
export default async function BrowsePage() {
  const categories = await getCategories();
  const sections = await Promise.all(
    categories.map(async (c) => ({ category: c, products: await getProductsByCategory(c.id) })),
  );

  return (
    <div className="page browse" style={{ padding: 0, overflow: 'hidden' }}>
      <CategoryBrowser initialSections={sections} />
    </div>
  );
}

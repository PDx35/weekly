import type { Metadata } from 'next';
import { Rail } from '@/components/catalogue/Rail';
import { CategoryGrid } from '@/components/catalogue/CategoryGrid';
import { Crumbs } from '@/components/ui/Crumbs';
import { getCategories, getProductsByCategory } from '@/lib/queries';
import { routes } from '@/lib/routes';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All categories',
  description:
    'Browse every FreshMart category — fresh fruits, vegetables, dairy, bakery, staples and more.',
};

/** Browse page: one rail per category with a "See all" link. */
export default async function BrowsePage() {
  const categories = await getCategories();
  const sections = await Promise.all(
    categories.map(async (c) => ({ category: c, products: await getProductsByCategory(c.id) })),
  );

  return (
    <div className="page browse">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'All categories' }]} />
      <h1 className="page-title">All categories</h1>
      <CategoryGrid categories={categories} title={null} />
      {sections.map(({ category, products }) => (
        <section className="cat-block" key={category.id}>
          <Rail
            title={category.name}
            sub={category.blurb}
            action="See all"
            actionHref={routes.category(category.slug)}
            products={products.slice(0, 6)}
          />
        </section>
      ))}
    </div>
  );
}

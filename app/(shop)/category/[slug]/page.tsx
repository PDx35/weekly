import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductBrowser } from '@/components/catalogue/ProductBrowser';
import { Crumbs } from '@/components/ui/Crumbs';
import { Icon } from '@/components/ui/Icon';
import { getAllCategorySlugs, getCategoryBySlug, getProductsByCategory } from '@/lib/queries';
import { routes } from '@/lib/routes';

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render every category at build time (ISR for any added later). */
export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category not found' };
  const title = category.name;
  const description = `${category.blurb} — shop ${category.name} on FreshMart, delivered in 30 minutes.`;
  return {
    title,
    description,
    alternates: { canonical: routes.category(category.slug) },
    openGraph: { title: `${title} · FreshMart`, description, type: 'website' },
  };
}

/** Category page: tinted hero, sort/filter bar, and a responsive product grid. */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);

  return (
    <div className="page category">
      <Crumbs
        items={[
          { label: 'Home', href: routes.home() },
          { label: 'Categories', href: routes.browse() },
          { label: category.name },
        ]}
      />
      <header className="cat-hero" style={{ background: category.tint, color: category.ink }}>
        <div>
          <h1>{category.name}</h1>
          <p>
            {category.blurb} · {products.length} products
          </p>
        </div>
        <span className="cat-hero-ico">
          <Icon name="leaf" size={40} stroke={1.4} />
        </span>
      </header>
      <ProductBrowser products={products} />
    </div>
  );
}

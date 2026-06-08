import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductBuy } from '@/components/catalogue/ProductBuy';
import { ProductGallery } from '@/components/catalogue/ProductGallery';
import { Rail } from '@/components/catalogue/Rail';
import { Crumbs } from '@/components/ui/Crumbs';
import { Icon, type IconName } from '@/components/ui/Icon';
import {
  getAllProductSlugs,
  getCategoryBySlug,
  getProductBySlug,
  getProductsByCategory,
} from '@/lib/queries';
import { routes } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const HIGHLIGHTS: { ico: IconName; t: string }[] = [
  { ico: 'truck', t: 'Delivered in 30 min' },
  { ico: 'leaf', t: 'Sourced & packed today' },
  { ico: 'shield', t: 'Freshness guaranteed' },
  { ico: 'pkg', t: 'Cold-chain handled' },
];

/** Pre-render every product at build time (ISR for any added later). */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  const description =
    product.desc ??
    `Buy ${product.name} (${product.unit}) on FreshMart, delivered fresh in 30 minutes.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: routes.product(product.slug) },
    openGraph: { title: `${product.name} · FreshMart`, description, type: 'website' },
  };
}

/** Product detail page: gallery, info + buy, highlights, accordions, related. */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategoryBySlug(product.cat);
  const related = (await getProductsByCategory(product.cat))
    .filter((x) => x.id !== product.id)
    .slice(0, 5);
  const categoryName = category?.name ?? product.cat;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.desc ?? `${product.name} (${product.unit})`,
    sku: product.id,
    category: categoryName,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: `https://schema.org/${product.stock ? 'InStock' : 'OutOfStock'}`,
      url: `${SITE_URL}${routes.product(product.slug)}`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
  };

  return (
    <div className="page product">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Crumbs
        items={[
          { label: 'Home', href: routes.home() },
          ...(category ? [{ label: categoryName, href: routes.category(category.slug) }] : []),
          { label: product.name },
        ]}
      />

      <div className="pd">
        <ProductGallery product={product} />

        <div className="pd-info">
          <h1>{product.name}</h1>

          <ProductBuy product={product} />

          <p className="pd-desc" style={{ marginTop: '16px' }}>
            {product.desc ??
              'Fresh, high-quality produce handpicked for your daily needs. Stored and delivered with care to preserve taste and nutrition.'}
          </p>

          <div className="pd-highlights">
            {HIGHLIGHTS.map((h) => (
              <div key={h.t} className="pd-hl">
                <Icon name={h.ico} size={18} />
                <span>{h.t}</span>
              </div>
            ))}
          </div>

          <div className="pd-acc">
            <details open>
              <summary>
                Product details <Icon name="chevD" size={16} />
              </summary>
              <ul>
                <li>
                  <span>Category</span>
                  <b>{categoryName}</b>
                </li>
                <li>
                  <span>Net quantity</span>
                  <b>{product.unit}</b>
                </li>
                <li>
                  <span>Shelf life</span>
                  <b>Best within 3–5 days</b>
                </li>
                <li>
                  <span>Storage</span>
                  <b>Refrigerate after delivery</b>
                </li>
                <li>
                  <span>Country of origin</span>
                  <b>India</b>
                </li>
              </ul>
            </details>
            <details>
              <summary>
                Delivery &amp; returns <Icon name="chevD" size={16} />
              </summary>
              <p>
                Delivered in ~30 minutes from your nearest FreshMart store. Not happy with the
                freshness? Report at delivery for an instant refund — no questions asked.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && <Rail title="You might also like" products={related} />}
    </div>
  );
}

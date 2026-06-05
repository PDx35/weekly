import type { MetadataRoute } from 'next';
import { getAllCategorySlugs, getAllProductSlugs } from '@/lib/queries';
import { routes } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';

/** Dynamic sitemap covering static pages + every category and product slug. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorySlugs, productSlugs] = await Promise.all([
    getAllCategorySlugs(),
    getAllProductSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}${routes.browse()}`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}${routes.support()}`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}${routes.category(slug)}`,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${SITE_URL}${routes.product(slug)}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}

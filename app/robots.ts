import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** robots.txt: index the catalogue, keep private/transactional routes out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account',
        '/orders',
        '/addresses',
        '/checkout',
        '/cart',
        '/auth',
        '/confirm/',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

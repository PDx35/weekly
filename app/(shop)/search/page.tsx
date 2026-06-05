import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductBrowser } from '@/components/catalogue/ProductBrowser';
import { Crumbs } from '@/components/ui/Crumbs';
import { Empty } from '@/components/ui/Empty';
import { catName } from '@/lib/data';
import { searchProducts } from '@/lib/queries';
import { routes } from '@/lib/routes';

export const metadata: Metadata = { title: 'Search' };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

/** Search results page. Reads `q` from the query string and renders matches,
 * suggested category chips, and an empty state when nothing matches. */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const matches = await searchProducts(query);
  const cats = [...new Set(matches.map((p) => p.cat))];

  return (
    <div className="page search-page">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'Search' }]} />
      <h1 className="page-title">Results for “{query}”</h1>

      {cats.length > 1 && (
        <div className="search-cats">
          {cats.map((c) => (
            <Link key={c} className="chip" href={routes.category(c)}>
              {catName(c)}
            </Link>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <Empty
          icon="search"
          title={`No results for “${query}”`}
          sub="Try a different spelling, or browse our categories."
        >
          <Link className="btn btn-primary btn-md" href={routes.browse()}>
            <span>Browse categories</span>
          </Link>
        </Empty>
      ) : (
        <ProductBrowser products={matches} />
      )}
    </div>
  );
}

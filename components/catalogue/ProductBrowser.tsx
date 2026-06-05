'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/lib/types';

type SortKey = 'pop' | 'lo' | 'hi' | 'rate';

const SORT_OPTIONS: [SortKey, string][] = [
  ['pop', 'Popularity'],
  ['lo', 'Price: low to high'],
  ['hi', 'Price: high to low'],
  ['rate', 'Top rated'],
];

/**
 * Client-side sort + "on offer" filter over a product list, with a responsive
 * grid. Ported from the prototype's `useSortFilter` + `SortBar` + `ProductGrid`.
 * Used by both the category and search pages.
 */
export function ProductBrowser({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>('pop');
  const [onlyDeals, setOnlyDeals] = useState(false);

  const list = useMemo(() => {
    const next = onlyDeals ? products.filter((p) => p.mrp) : [...products];
    if (sort === 'lo') next.sort((a, b) => a.price - b.price);
    else if (sort === 'hi') next.sort((a, b) => b.price - a.price);
    else if (sort === 'rate') next.sort((a, b) => b.rating - a.rating);
    return next;
  }, [products, sort, onlyDeals]);

  return (
    <>
      <div className="sortbar">
        <span className="sortbar-count">{list.length} items</span>
        <div className="sortbar-right">
          <button
            className={`chip ${onlyDeals ? 'chip-on' : ''}`}
            onClick={() => setOnlyDeals((v) => !v)}
          >
            <Icon name="tag" size={14} /> On offer
          </button>
          <label className="sortbar-sort">
            <Icon name="filter" size={15} />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORT_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="pgrid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}

'use client';

import { useMemo } from 'react';
import type { AdminCategory, AdminProduct } from '@/lib/admin/types';
import type { Order } from '@/lib/types';
import { rupee } from '@/components/ui/Price';

interface TopProductsProps {
  orders: Order[];
  products: AdminProduct[];
  categories: AdminCategory[];
}

interface ProductSales {
  id: string;
  name: string;
  categoryName: string;
  qty: number;
  revenue: number;
}

export function TopProducts({ orders, products, categories }: TopProductsProps) {
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const salesLeaderboard = useMemo(() => {
    const aggregates = new Map<string, { qty: number; revenue: number; name: string; categoryId: string }>();

    // Accumulate sales from orders that are not cancelled
    for (const o of orders) {
      if (o.status === 'cancelled') continue;

      const items = o.items ?? [];
      for (const it of items) {
        if (!it.productId) continue;
        const current = aggregates.get(it.productId) ?? { qty: 0, revenue: 0, name: it.name, categoryId: '' };
        
        current.qty += it.qty ?? 0;
        current.revenue += (it.price ?? 0) * (it.qty ?? 0);

        // Try to enrich category if not set
        if (!current.categoryId) {
          const matchedProd = productMap.get(it.productId);
          if (matchedProd) {
            current.categoryId = matchedProd.category;
          }
        }
        
        aggregates.set(it.productId, current);
      }
    }

    // Convert map to sorted list
    const leaderboard: ProductSales[] = [...aggregates.entries()]
      .map(([id, data]) => {
        const catName = categoryMap.get(data.categoryId) ?? 'Other';
        return {
          id,
          name: data.name,
          categoryName: catName,
          qty: data.qty,
          revenue: data.revenue,
        };
      })
      .filter((item) => item.qty > 0)
      // Sort by quantity sold descending
      .sort((a, b) => b.qty - a.qty)
      // Take top 5
      .slice(0, 5);

    return leaderboard;
  }, [orders, productMap, categoryMap]);

  // Find max quantity to determine relative scale width
  const maxQty = salesLeaderboard[0]?.qty ?? 1;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">Top Selling Products</h3>

      {salesLeaderboard.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-neutral-900">No Sales Data</p>
          <p className="text-xs text-neutral-500">Wait for orders to process to see leaderboard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {salesLeaderboard.map((item, index) => {
            const percentage = Math.min(100, Math.max(8, (item.qty / maxQty) * 100));
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-neutral-500 mr-1.5">#{index + 1}</span>
                    <span className="font-medium text-neutral-900 truncate inline-block max-w-[200px] align-bottom">
                      {item.name}
                    </span>
                    <span className="mx-1 text-neutral-300">·</span>
                    <span className="text-neutral-500">{item.categoryName}</span>
                  </div>
                  <div className="text-right font-medium shrink-0">
                    <span className="text-neutral-900">{item.qty} units</span>
                    <span className="mx-1 text-neutral-300">·</span>
                    <span className="text-emerald-700">{rupee(item.revenue)}</span>
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

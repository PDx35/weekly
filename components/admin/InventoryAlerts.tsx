'use client';

import Link from 'next/link';
import type { AdminCategory, AdminProduct } from '@/lib/admin/types';

interface InventoryAlertsProps {
  products: AdminProduct[];
  categories: AdminCategory[];
}

export function InventoryAlerts({ products, categories }: InventoryAlertsProps) {
  // Map categories for quick name lookup
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Find products that are out of stock or below their low stock threshold
  const alerts = products
    .filter((p) => {
      const threshold = p.lowStockAlertAt ?? 5;
      return p.stock <= threshold;
    })
    .map((p) => {
      const threshold = p.lowStockAlertAt ?? 5;
      const isOutOfStock = p.stock <= 0;
      return {
        ...p,
        threshold,
        isOutOfStock,
      };
    })
    // Sort out of stock first, then by current stock ascending
    .sort((a, b) => {
      if (a.isOutOfStock && !b.isOutOfStock) return -1;
      if (!a.isOutOfStock && b.isOutOfStock) return 1;
      return a.stock - b.stock;
    });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Inventory Alerts</h3>
        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          {alerts.length} warning{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            ✓
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-900">Inventory Healthy</p>
          <p className="text-xs text-neutral-500">All items are sufficiently stocked.</p>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-1">
          <div className="divide-y divide-neutral-100">
            {alerts.slice(0, 15).map((p) => (
              <div key={p.id} className="group py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        p.isOutOfStock
                          ? 'animate-pulse bg-rose-600'
                          : 'bg-amber-500'
                      }`}
                      aria-hidden="true"
                    />
                    <h4 className="truncate text-sm font-medium text-neutral-900 group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h4>
                  </div>
                  <p className="mt-0.5 pl-4 text-xs text-neutral-500 truncate">
                    {categoryMap.get(p.category) ?? p.category} · Threshold: {p.threshold}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      p.isOutOfStock
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {p.isOutOfStock ? 'Out of stock' : `${p.stock} left`}
                  </span>

                  <Link
                    href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Restock
                  </Link>
                </div>
              </div>
            ))}
            {alerts.length > 15 && (
              <div className="pt-2.5 text-center">
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  View all alerts (+{alerts.length - 15} more)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

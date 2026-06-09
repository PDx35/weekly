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
    <div className="rounded-2xl border border-neutral-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
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
        <div className="max-h-[300px] overflow-y-auto pr-2 relative mt-4 no-scrollbar">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-neutral-200/60 via-neutral-200/60 to-transparent" />
          <div className="flex flex-col gap-5">
            {alerts.slice(0, 15).map((p, idx) => (
              <div key={p.id} className="group relative flex items-start gap-4 p-2 -mx-2 rounded-xl transition-all hover:bg-white/40 hover:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]">
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200 z-10 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:ring-emerald-200">
                  {p.isOutOfStock ? (
                    <div className="size-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                  ) : (
                    <div className="size-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center pt-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate text-sm font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h4>
                    <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">
                      {p.isOutOfStock ? '0 left' : `${p.stock} left`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-neutral-500 truncate">
                      {categoryMap.get(p.category) ?? p.category}
                    </p>
                    <Link
                      href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                      className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length > 15 && (
              <div className="pt-2 text-center text-xs font-medium text-neutral-500 relative z-10 bg-white/60 py-2 rounded-md backdrop-blur-md">
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

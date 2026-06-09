'use client';

import { useMemo } from 'react';
import type { Order, OrderStatus } from '@/lib/types';

interface OrderStatusBreakdownProps {
  orders: Order[];
}

interface StatusStat {
  status: OrderStatus;
  label: string;
  count: number;
  percentage: number;
  bgColor: string;
  textColor: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  pending: { label: 'Pending Payment', bgColor: 'bg-neutral-400', textColor: 'text-neutral-700' },
  confirmed: { label: 'Confirmed', bgColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  packed: { label: 'Packed & Ready', bgColor: 'bg-orange-400', textColor: 'text-orange-700' },
  out_for_delivery: { label: 'Out for Delivery', bgColor: 'bg-amber-500', textColor: 'text-amber-800' },
  delivered: { label: 'Delivered', bgColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-rose-500', textColor: 'text-rose-700' },
};

export function OrderStatusBreakdown({ orders }: OrderStatusBreakdownProps) {
  const stats = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      packed: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    // Count each status
    for (const o of orders) {
      if (o.status in counts) {
        counts[o.status]++;
      }
    }

    const total = orders.length || 1;

    // Convert to config-enriched list
    const list: StatusStat[] = (Object.keys(STATUS_CONFIG) as OrderStatus[]).map((key) => {
      const config = STATUS_CONFIG[key];
      const count = counts[key];
      const percentage = Math.round((count / total) * 100);
      return {
        status: key,
        label: config.label,
        count,
        percentage,
        bgColor: config.bgColor,
        textColor: config.textColor,
      };
    });

    return { list, totalOrders: orders.length };
  }, [orders]);

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900 pb-4">Order Status Distribution</h3>

      {stats.totalOrders === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-neutral-900">No Orders Available</p>
          <p className="text-xs text-neutral-500 font-normal">Order statuses will appear here once orders are placed.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Stacked distribution preview bar */}
          <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-neutral-100">
            {stats.list
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.status}
                  style={{ width: `${s.percentage}%` }}
                  className={`${s.bgColor} h-full transition-all duration-700 ease-in-out hover:opacity-80 cursor-pointer hover:scale-y-110 origin-bottom`}
                  title={`${s.label}: ${s.count} (${s.percentage}%)`}
                />
              ))}
          </div>

          {/* Grid display of statuses */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            {stats.list.map((s) => (
              <div key={s.status} className="flex items-start gap-2 text-xs">
                <span className={`mt-1 size-2 shrink-0 rounded-full ${s.bgColor}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="font-medium text-neutral-900 truncate">{s.label}</div>
                  <div className="mt-0.5 text-neutral-500 font-normal">
                    {s.count} order{s.count !== 1 ? 's' : ''} ({s.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

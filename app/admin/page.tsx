'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardCharts } from '@/components/admin/DashboardCharts';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminPageHeader } from '@/components/admin/ui';
import { rupee } from '@/components/ui/Price';
import { listAll } from '@/lib/admin/db';
import type { AdminCategory, AdminProduct, AdminTicket } from '@/lib/admin/types';
import { timeAgo } from '@/lib/orders';
import type { Order } from '@/lib/types';

interface DashboardData {
  products: AdminProduct[];
  categories: AdminCategory[];
  orders: Order[];
  tickets: AdminTicket[];
}

const PENDING_STATUSES: Order['status'][] = ['pending', 'confirmed', 'packed', 'out_for_delivery'];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [products, categories, orders, tickets] = await Promise.all([
          listAll<AdminProduct>('products'),
          listAll<AdminCategory>('categories'),
          listAll<Order>('orders'),
          listAll<AdminTicket>('supportTickets'),
        ]);
        if (active) setData({ products, categories, orders, tickets });
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { products, categories, orders, tickets } = data;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totals?.grand ?? 0), 0);
    const recent = [...orders].sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0)).slice(0, 6);
    return {
      products: products.length,
      categories: categories.length,
      orders: orders.length,
      revenue,
      pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
      openTickets: tickets.filter((t) => t.status !== 'resolved').length,
      recent,
    };
  }, [data]);

  return (
    <>
      <AdminPageHeader title="Dashboard" />
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Couldn’t load some data. Ensure Firestore rules grant admin access and the collections
          exist.
        </p>
      )}
      {!data || !stats ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Revenue" value={rupee(stats.revenue)} />
            <StatCard label="Orders" value={stats.orders} />
            <StatCard label="Pending fulfilment" value={stats.pending} />
            <StatCard label="Products" value={stats.products} />
            <StatCard label="Categories" value={stats.categories} />
            <StatCard label="Open tickets" value={stats.openTickets} />
          </div>

          <div className="mt-6">
            <DashboardCharts
              orders={data.orders}
              products={data.products}
              categories={data.categories}
            />
          </div>

          <h2 className="pt-8 pb-4 text-base font-semibold text-neutral-900">Recent orders</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {stats.recent.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((o) => (
                    <tr key={o.id} className="border-t border-neutral-100">
                      <td className="px-4 py-2.5 font-medium">#{o.id}</td>
                      <td className="px-4 py-2.5 capitalize">{o.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5">{rupee(o.totals?.grand ?? 0)}</td>
                      <td className="px-4 py-2.5 text-neutral-500">
                        {o.placedAt ? timeAgo(o.placedAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

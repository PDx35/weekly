'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardCharts } from '@/components/admin/DashboardCharts';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminPageHeader } from '@/components/admin/ui';
import { rupee } from '@/components/ui/Price';
import {
  Banknote,
  ShoppingCart,
  Clock,
  Package,
  Tags,
  Ticket,
} from 'lucide-react';
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon size={16} strokeWidth={2} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-neutral-900">{value}</div>
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
      <AdminPageHeader title="Dashboard Overview" />
      
      {error && (
        <p className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn’t load some data. Ensure Firestore rules grant admin access and the collections exist.
        </p>
      )}
      
      {!data || !stats ? (
        <div className="flex py-12 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 max-w-7xl">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Revenue" value={rupee(stats.revenue)} icon={Banknote} />
            <StatCard label="Total Orders" value={stats.orders} icon={ShoppingCart} />
            <StatCard label="Pending Orders" value={stats.pending} icon={Clock} />
            <StatCard label="Active Products" value={stats.products} icon={Package} />
            <StatCard label="Categories" value={stats.categories} icon={Tags} />
            <StatCard label="Open Tickets" value={stats.openTickets} icon={Ticket} />
          </div>

          {/* Charts */}
          <div>
            <DashboardCharts
              orders={data.orders}
              products={data.products}
              categories={data.categories}
            />
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Orders</h2>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              {stats.recent.length === 0 ? (
                <p className="p-8 text-center text-sm text-neutral-500">No orders yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Order ID</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Total</th>
                      <th className="px-6 py-3 font-medium">Placed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {stats.recent.map((o) => {
                      // Minimalist status badge
                      let dotColor = 'bg-neutral-300';
                      if (o.status === 'delivered') dotColor = 'bg-emerald-500';
                      else if (o.status === 'pending') dotColor = 'bg-amber-500';
                      else if (o.status === 'cancelled') dotColor = 'bg-red-500';
                      else dotColor = 'bg-blue-500';

                      return (
                        <tr key={o.id} className="transition-colors hover:bg-neutral-50">
                          <td className="px-6 py-4 font-medium text-neutral-900">#{o.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full ${dotColor}`} />
                              <span className="capitalize text-neutral-700">
                                {o.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-700">{rupee(o.totals?.grand ?? 0)}</td>
                          <td className="px-6 py-4 text-neutral-500">
                            {o.placedAt ? timeAgo(o.placedAt) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
        </div>
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

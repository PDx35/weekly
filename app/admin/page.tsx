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

// Import the new analytics widgets
import { InventoryAlerts } from '@/components/admin/InventoryAlerts';
import { TopProducts } from '@/components/admin/TopProducts';
import { OrderStatusBreakdown } from '@/components/admin/OrderStatusBreakdown';

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
  color = 'slate',
  chartType,
}: {
  label: string;
  value: string | number;
  icon: any;
  color?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'slate';
  chartType?: 'bar' | 'line';
}) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
    blue: 'text-blue-600 bg-blue-50 ring-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50 ring-indigo-100',
    amber: 'text-amber-600 bg-amber-50 ring-amber-100',
    rose: 'text-rose-600 bg-rose-50 ring-rose-100',
    slate: 'text-slate-600 bg-slate-50 ring-slate-100',
  };

  const svgColor = {
    emerald: '#10b981',
    blue: '#3b82f6',
    indigo: '#6366f1',
    amber: '#f59e0b',
    rose: '#f43f5e',
    slate: '#64748b',
  }[color];

  return (
    <div className="group relative overflow-hidden flex rounded-2xl border border-neutral-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-neutral-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex flex-col justify-between flex-1 gap-4">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <div className="text-3xl font-bold tracking-tight text-neutral-900">{value}</div>
      </div>
      <div className="relative flex flex-col justify-between items-end flex-1 pl-4">
        <div className={`flex size-8 items-center justify-center rounded-full ring-1 ${colorMap[color]}`}>
          <Icon size={14} strokeWidth={2} />
        </div>
        <div className="w-full h-12 mt-4 flex items-end justify-end opacity-80">
          {chartType === 'line' ? (
            <svg viewBox="0 0 100 40" className="w-full h-full preserve-aspect-ratio-none" fill="none">
              <path d="M0,35 L20,20 L40,25 L60,10 L80,15 L100,5" stroke={svgColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0,35 L20,20 L40,25 L60,10 L80,15 L100,5 L100,40 L0,40 Z" fill={svgColor} fillOpacity="0.1" />
            </svg>
          ) : chartType === 'bar' ? (
            <svg viewBox="0 0 100 40" className="w-full h-full preserve-aspect-ratio-none" fill="none">
              <rect x="0" y="20" width="12" height="20" rx="2" fill={svgColor} fillOpacity="0.8" />
              <rect x="18" y="10" width="12" height="30" rx="2" fill={svgColor} fillOpacity="0.8" />
              <rect x="36" y="25" width="12" height="15" rx="2" fill={svgColor} fillOpacity="0.8" />
              <rect x="54" y="5" width="12" height="35" rx="2" fill={svgColor} fillOpacity="0.8" />
              <rect x="72" y="15" width="12" height="25" rx="2" fill={svgColor} fillOpacity="0.8" />
              <rect x="90" y="20" width="12" height="20" rx="2" fill={svgColor} fillOpacity="0.8" />
            </svg>
          ) : null}
        </div>
      </div>
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

    // Filter out cancelled orders for revenue and performance calculations
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + (o.totals?.grand ?? 0), 0);
    const recent = [...orders].sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0)).slice(0, 6);

    // Calculate Average Order Value (AOV)
    const aov = activeOrders.length > 0 ? revenue / activeOrders.length : 0;

    // Calculate Active Customers (unique UIDs in active orders)
    const activeCustomers = new Set(activeOrders.map((o) => o.uid)).size;

    // Calculate Order Fulfillment Rate (delivered orders / active orders)
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const fulfillmentRate = activeOrders.length > 0 ? (deliveredCount / activeOrders.length) * 100 : 0;

    return {
      products: products.length,
      categories: categories.length,
      orders: orders.length,
      revenue,
      pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
      openTickets: tickets.filter((t) => t.status !== 'resolved').length,
      recent,
      aov,
      activeCustomers,
      fulfillmentRate,
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
        <div className="flex flex-col gap-6 max-w-7xl">
          
          {/* Top Section: Hero Charts (Line Chart + Donut Chart) */}
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <DashboardCharts
              orders={data.orders}
              products={data.products}
              categories={data.categories}
            />
          </div>

          {/* Middle Section: 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
            <StatCard label="Total Revenue" value={rupee(stats.revenue)} icon={Banknote} color="emerald" chartType="bar" />
            <StatCard label="Total Orders" value={stats.orders} icon={ShoppingCart} color="indigo" chartType="line" />
            <StatCard label="Pending Orders" value={stats.pending} icon={Clock} color="amber" chartType="line" />
            <StatCard label="Active Products" value={stats.products} icon={Package} color="blue" chartType="bar" />
          </div>

          {/* Bottom Section: Activity List & Data Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <InventoryAlerts products={data.products} categories={data.categories} />
              <OrderStatusBreakdown orders={data.orders} />
              <TopProducts orders={data.orders} products={data.products} categories={data.categories} />
            </div>
            
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex-1 rounded-2xl border border-neutral-200/60 bg-white/60 shadow-sm backdrop-blur-xl p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">Recent Orders</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Overview of Latest Month</p>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button className="flex items-center gap-1.5 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors">
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Add
                      </button>
                      <button className="flex items-center justify-center size-7 rounded border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </button>
                      <button className="flex items-center justify-center size-7 rounded border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                      <button className="flex items-center justify-center size-7 rounded border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search" 
                        className="h-8 w-48 rounded bg-neutral-100/80 px-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-neutral-400"
                      />
                      <div className="absolute inset-y-0 right-2 flex items-center justify-center pointer-events-none">
                        <svg className="size-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
              {stats.recent.length === 0 ? (
                <p className="p-8 text-center text-sm text-neutral-500">No orders yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-neutral-200 bg-white/50">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Order ID</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Placed Date</th>
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
                        <tr key={o.id} className="group transition-all duration-200 hover:bg-neutral-50/80 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-0 hover:z-10 cursor-pointer rounded-xl">
                          <td className="px-6 py-4 font-semibold text-neutral-900 transition-colors group-hover:text-emerald-700">#{o.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex size-2">
                                {o.status === 'pending' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />}
                                <span className={`relative inline-flex size-2 rounded-full ${dotColor}`} />
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                                {o.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-neutral-800">{rupee(o.totals?.grand ?? 0)}</td>
                          <td className="px-6 py-4 text-xs font-medium text-neutral-500">
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

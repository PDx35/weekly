'use client';

import { useEffect, useMemo, useState } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { AdminShell } from '@/components/admin/AdminShell';
import { FilterBar, SortTh, useSort } from '@/components/admin/SortHeader';
import { AdminInput, AdminPageHeader, AdminSelect } from '@/components/admin/ui';
import { rupee } from '@/components/ui/Price';
import { listAll, updateDocFields } from '@/lib/admin/db';
import { nowMs, timeAgo } from '@/lib/orders';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

type OrderSortKey = 'id' | 'items' | 'total' | 'placed' | 'status';

const ORDER_ACCESSORS: Record<OrderSortKey, (o: Order) => string | number | boolean> = {
  id: (o) => o.id,
  items: (o) => o.items?.reduce((a, b) => a + b.qty, 0) ?? 0,
  total: (o) => o.totals?.grand ?? 0,
  placed: (o) => o.placedAt ?? 0,
  status: (o) => o.status ?? '',
};

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const reload = async () => {
    try {
      const list = await listAll<Order>('orders');
      setOrders(list);
    } catch {
      setError('Could not load orders. Check admin access and Firestore rules.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load; state set after I/O
    void reload();
  }, []);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setSavingId(order.id);
    setError('');
    try {
      await updateDocFields('orders', order.id, {
        status,
        statusHistory: arrayUnion({ status, at: nowMs() }),
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch {
      setError('Could not update status.');
    } finally {
      setSavingId(null);
    }
  };

  // Derive unique payment methods for filter dropdown
  const paymentMethods = useMemo(() => {
    const methods = new Set(orders.map((o) => o.payment?.label).filter(Boolean));
    return [...methods].sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.address?.label ?? '').toLowerCase().includes(q) ||
          (o.address?.name ?? '').toLowerCase().includes(q),
      );
    }
    if (filterStatus !== 'all') list = list.filter((o) => o.status === filterStatus);
    if (filterPayment !== 'all') list = list.filter((o) => o.payment?.label === filterPayment);
    return list;
  }, [orders, searchQ, filterStatus, filterPayment]);

  const { sorted, sort, toggle } = useSort(filtered, ORDER_ACCESSORS, 'placed', 'desc');

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <AdminPageHeader title="Orders" />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && orders.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FilterBar>
            <AdminInput
              placeholder="Search order id…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full sm:!w-52"
            />
            <AdminSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:!w-44"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full sm:!w-40"
            >
              <option value="all">All payments</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </AdminSelect>
            <span className="text-xs text-neutral-400">
              {sorted.length} of {orders.length}
            </span>
          </FilterBar>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white/60 shadow-sm backdrop-blur-xl p-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-neutral-200 bg-white/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <SortTh label="Order" sortKey="id" current={sort} onToggle={toggle} />
                <SortTh label="Items" sortKey="items" current={sort} onToggle={toggle} />
                <SortTh label="Total" sortKey="total" current={sort} onToggle={toggle} />
                <th className="px-6 py-4">Payment</th>
                <SortTh label="Placed" sortKey="placed" current={sort} onToggle={toggle} />
                <SortTh label="Status" sortKey="status" current={sort} onToggle={toggle} />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.map((o) => (
                <tr key={o.id} className="group transition-all duration-200 hover:bg-neutral-50/80 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-0 hover:z-10 cursor-pointer rounded-xl align-top">
                  <td className="px-6 py-4 font-semibold text-neutral-900 transition-colors group-hover:text-emerald-700">
                    #{o.id}
                    <div className="mt-1 text-xs font-normal text-neutral-400">{o.address?.label}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                      {o.items?.reduce((a, b) => a + b.qty, 0) ?? 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-800">{rupee(o.totals?.grand ?? 0)}</td>
                  <td className="px-6 py-4 text-neutral-600">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-neutral-700">{o.payment?.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400">{o.payment?.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-neutral-500">
                    {o.placedAt ? timeAgo(o.placedAt) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <AdminSelect
                      value={o.status}
                      disabled={savingId === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      className="h-9 w-44"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </AdminSelect>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <Orders />
    </AdminShell>
  );
}

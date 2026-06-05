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
      <AdminPageHeader title="Orders" />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && orders.length > 0 && (
        <FilterBar>
          <AdminInput
            placeholder="Search order id…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="!w-52"
          />
          <AdminSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="!w-44"
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
            className="!w-40"
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
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <SortTh label="Order" sortKey="id" current={sort} onToggle={toggle} />
                <SortTh label="Items" sortKey="items" current={sort} onToggle={toggle} />
                <SortTh label="Total" sortKey="total" current={sort} onToggle={toggle} />
                <th className="px-4 py-2.5">Payment</th>
                <SortTh label="Placed" sortKey="placed" current={sort} onToggle={toggle} />
                <SortTh label="Status" sortKey="status" current={sort} onToggle={toggle} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100 align-top">
                  <td className="px-4 py-2.5 font-medium">
                    #{o.id}
                    <div className="text-xs font-normal text-neutral-400">{o.address?.label}</div>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {o.items?.reduce((a, b) => a + b.qty, 0) ?? 0}
                  </td>
                  <td className="px-4 py-2.5">{rupee(o.totals?.grand ?? 0)}</td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {o.payment?.label}
                    <div className="text-xs text-neutral-400">{o.payment?.status}</div>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {o.placedAt ? timeAgo(o.placedAt) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <AdminSelect
                      value={o.status}
                      disabled={savingId === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      className="h-8 w-44"
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

'use client';

import { useEffect, useState } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminPageHeader, AdminSelect } from '@/components/admin/ui';
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

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = async () => {
    try {
      const list = await listAll<Order>('orders');
      setOrders([...list].sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0)));
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

  return (
    <>
      <AdminPageHeader title="Orders" />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5">Placed</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
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

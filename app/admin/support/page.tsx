'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminButton, AdminPageHeader } from '@/components/admin/ui';
import { listAll, updateDocFields } from '@/lib/admin/db';
import type { AdminTicket } from '@/lib/admin/types';

function Support() {
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = async () => {
    try {
      setItems(await listAll<AdminTicket>('supportTickets'));
    } catch {
      setError('Could not load tickets. Check admin access and Firestore rules.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load; state set after I/O
    void reload();
  }, []);

  const setStatus = async (t: AdminTicket, status: 'open' | 'resolved') => {
    setSavingId(t.id);
    try {
      await updateDocFields('supportTickets', t.id, { status });
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status } : x)));
    } catch {
      setError('Could not update ticket.');
    } finally {
      setSavingId(null);
    }
  };

  const open = items.filter((t) => t.status !== 'resolved');
  const resolved = items.filter((t) => t.status === 'resolved');
  const ordered = [...open, ...resolved];

  return (
    <>
      <AdminPageHeader title="Support tickets" />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-neutral-500">No tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {ordered.map((t) => (
            <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{t.topic || 'Request'}</span>
                  <span
                    className={
                      t.status === 'resolved'
                        ? 'rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500'
                        : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'
                    }
                  >
                    {t.status ?? 'open'}
                  </span>
                  {t.ticketId && <span className="text-xs text-neutral-400">#{t.ticketId}</span>}
                </div>
                {t.status === 'resolved' ? (
                  <AdminButton
                    variant="ghost"
                    disabled={savingId === t.id}
                    onClick={() => setStatus(t, 'open')}
                  >
                    Reopen
                  </AdminButton>
                ) : (
                  <AdminButton
                    disabled={savingId === t.id}
                    onClick={() => setStatus(t, 'resolved')}
                  >
                    Mark resolved
                  </AdminButton>
                )}
              </div>
              <p className="text-sm text-neutral-700">{t.message}</p>
              <div className="mt-2 text-xs text-neutral-400">
                {t.orderId ? `Order ${t.orderId} · ` : ''}
                {t.uid ? `User ${t.uid}` : 'Guest'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminSupportPage() {
  return (
    <AdminShell>
      <Support />
    </AdminShell>
  );
}

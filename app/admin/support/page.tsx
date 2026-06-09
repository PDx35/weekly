'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { FilterBar } from '@/components/admin/SortHeader';
import { AdminButton, AdminInput, AdminPageHeader, AdminSelect } from '@/components/admin/ui';
import { listAll, updateDocFields } from '@/lib/admin/db';
import type { AdminTicket } from '@/lib/admin/types';

function Support() {
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'status' | 'topic'>('status');

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

  const filtered = useMemo(() => {
    let list = items;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (t) =>
          (t.topic ?? '').toLowerCase().includes(q) ||
          (t.ticketId ?? '').toLowerCase().includes(q) ||
          (t.message ?? '').toLowerCase().includes(q) ||
          (t.orderId ?? '').toLowerCase().includes(q),
      );
    }
    if (filterStatus === 'open') list = list.filter((t) => t.status !== 'resolved');
    if (filterStatus === 'resolved') list = list.filter((t) => t.status === 'resolved');
    return list;
  }, [items, searchQ, filterStatus]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'status') {
      // open first, then resolved
      arr.sort((a, b) => {
        const aRes = a.status === 'resolved' ? 1 : 0;
        const bRes = b.status === 'resolved' ? 1 : 0;
        return aRes - bRes;
      });
    } else {
      arr.sort((a, b) => (a.topic ?? '').localeCompare(b.topic ?? ''));
    }
    return arr;
  }, [filtered, sortBy]);

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <AdminPageHeader title="Support tickets" />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && items.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FilterBar>
            <AdminInput
              placeholder="Search topic, ticket, order…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full sm:!w-60"
            />
            <AdminSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'resolved')}
              className="w-full sm:!w-36"
            >
              <option value="all">All tickets</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </AdminSelect>
            <AdminSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'status' | 'topic')}
              className="w-full sm:!w-36"
            >
              <option value="status">Sort: Status</option>
              <option value="topic">Sort: Topic</option>
            </AdminSelect>
            <span className="text-xs text-neutral-400">
              {sorted.length} of {items.length}
            </span>
          </FilterBar>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No tickets yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No tickets match filters.</p>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          {sorted.map((t) => (
            <div key={t.id} className="rounded-2xl border border-neutral-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:bg-neutral-50/80 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-neutral-900">{t.topic || 'Request'}</span>
                  <span
                    className={
                      t.status === 'resolved'
                        ? 'rounded bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-500'
                        : 'rounded bg-amber-100/80 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800'
                    }
                  >
                    {t.status ?? 'open'}
                  </span>
                  {t.ticketId && <span className="text-xs font-mono font-medium text-neutral-400">#{t.ticketId}</span>}
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
              <p className="text-sm text-neutral-700 bg-white/50 rounded-xl p-4 border border-neutral-100">{t.message}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-neutral-500">
                {t.orderId ? (
                  <span className="flex items-center gap-1"><span className="text-neutral-400">Order</span> <span className="text-neutral-800">#{t.orderId}</span></span>
                ) : null}
                {t.orderId && <span className="text-neutral-300">•</span>}
                <span className="flex items-center gap-1"><span className="text-neutral-400">User</span> <span className="text-neutral-800">{t.uid || 'Guest'}</span></span>
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

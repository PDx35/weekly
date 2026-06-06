'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { FilterBar, SortTh, useSort } from '@/components/admin/SortHeader';
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminPageHeader,
  AdminSelect,
  Labeled,
} from '@/components/admin/ui';
import { createDoc, listAll, removeDoc, updateDocFields } from '@/lib/admin/db';
import type { AdminMarketStop } from '@/lib/admin/types';
import { DAY_NAMES, dayNames } from '@/lib/market';
import { cn } from '@/lib/utils';

type Draft = {
  days: number[];
  area: string;
  zip: string;
  lng: string;
  lat: string;
  discountPercent: string;
};

const emptyDraft = (): Draft => ({
  days: [1],
  area: '',
  zip: '',
  lng: '',
  lat: '',
  discountPercent: '10',
});

/** Normalise a stop, tolerating legacy single-`day` docs. */
function normalizeStop(m: AdminMarketStop): AdminMarketStop {
  const legacy = m as AdminMarketStop & { day?: number };
  const days = Array.isArray(m.days) ? m.days : typeof legacy.day === 'number' ? [legacy.day] : [];
  return { ...m, days };
}

type MarketSortKey = 'day' | 'area' | 'zip' | 'discount';

const MARKET_ACCESSORS: Record<MarketSortKey, (m: AdminMarketStop) => string | number | boolean> = {
  day: (m) => (m.days.length ? Math.min(...m.days.map((d) => (d + 6) % 7)) : 7), // earliest, Mon-first
  area: (m) => (m.area ?? '').toLowerCase(),
  zip: (m) => m.zip ?? '',
  discount: (m) => m.discountPercent ?? 0,
};

function Market() {
  const [items, setItems] = useState<AdminMarketStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminMarketStop | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');

  const reload = async () => {
    try {
      const list = await listAll<AdminMarketStop>('weeklyMarket');
      setItems(list.map(normalizeStop));
    } catch (e) {
      const err = e as { code?: string; message?: string };
      console.error('weeklyMarket load failed:', e);
      setError(`Could not load market stops — ${err.code ?? err.message ?? 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load; state set after I/O
    void reload();
  }, []);

  const close = () => {
    setDraft(null);
    setEditing(null);
  };

  const filtered = useMemo(() => {
    let list = items;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (m) => (m.area ?? '').toLowerCase().includes(q) || (m.zip ?? '').includes(q),
      );
    }
    if (filterDay !== 'all') list = list.filter((m) => m.days.includes(Number(filterDay)));
    return list;
  }, [items, searchQ, filterDay]);

  const { sorted, sort, toggle } = useSort(filtered, MARKET_ACCESSORS, 'day');

  const save = async () => {
    if (!draft) return;
    if (!draft.area.trim() || !draft.zip.trim()) {
      setError('Area and pincode are required.');
      return;
    }
    if (draft.days.length === 0) {
      setError('Pick at least one open day.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      days: [...draft.days].sort((a, b) => a - b),
      area: draft.area.trim(),
      zip: draft.zip.trim(),
      lng: Number(draft.lng) || 0,
      lat: Number(draft.lat) || 0,
      discountPercent: Number(draft.discountPercent) || 0,
    };
    try {
      if (editing) await updateDocFields('weeklyMarket', editing.id, payload);
      else await createDoc('weeklyMarket', payload);
      close();
      await reload();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (m: AdminMarketStop) => {
    if (!confirm(`Delete the ${m.area} stop?`)) return;
    try {
      await removeDoc('weeklyMarket', m.id);
      await reload();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Weekly market"
        action={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft());
            }}
          >
            + Add stop
          </AdminButton>
        }
      />
      <p className="mb-4 text-sm text-neutral-500">
        A stop can open on one or more weekdays; the covered pincode gets the discount on those
        days.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && items.length > 0 && (
        <FilterBar>
          <AdminInput
            placeholder="Search area or pincode…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="!w-52"
          />
          <AdminSelect
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="!w-40"
          >
            <option value="all">All days</option>
            {DAY_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </AdminSelect>
          <span className="text-xs text-neutral-400">
            {sorted.length} of {items.length}
          </span>
        </FilterBar>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No market stops yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No stops match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <SortTh label="Day" sortKey="day" current={sort} onToggle={toggle} />
                <SortTh label="Area" sortKey="area" current={sort} onToggle={toggle} />
                <SortTh label="Pincode" sortKey="zip" current={sort} onToggle={toggle} />
                <SortTh label="Discount" sortKey="discount" current={sort} onToggle={toggle} />
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium">{dayNames(m.days)}</td>
                  <td className="px-4 py-2.5">{m.area}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{m.zip}</td>
                  <td className="px-4 py-2.5">{m.discountPercent}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setDraft({
                          days: [...m.days],
                          area: m.area ?? '',
                          zip: m.zip ?? '',
                          lng: String(m.lng ?? ''),
                          lat: String(m.lat ?? ''),
                          discountPercent: String(m.discountPercent ?? 0),
                        });
                      }}
                      className="mr-3 font-medium text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(m)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <AdminModal title={editing ? 'Edit stop' : 'New stop'} onClose={close}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Labeled label="Open days (select one or more)">
                <div className="flex flex-wrap gap-1.5">
                  {DAY_NAMES.map((name, i) => {
                    const on = draft.days.includes(i);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            days: on ? draft.days.filter((d) => d !== i) : [...draft.days, i],
                          })
                        }
                        className={cn(
                          'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                          on
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100',
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </Labeled>
            </div>
            <Labeled label="Discount %">
              <AdminInput
                type="number"
                value={draft.discountPercent}
                onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })}
              />
            </Labeled>
            <Labeled label="Area">
              <AdminInput
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                placeholder="Indiranagar"
              />
            </Labeled>
            <Labeled label="Pincode">
              <AdminInput
                value={draft.zip}
                onChange={(e) => setDraft({ ...draft, zip: e.target.value })}
                placeholder="560038"
              />
            </Labeled>
            <Labeled label="Longitude">
              <AdminInput
                value={draft.lng}
                onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                placeholder="77.6408"
              />
            </Labeled>
            <Labeled label="Latitude">
              <AdminInput
                value={draft.lat}
                onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                placeholder="12.9719"
              />
            </Labeled>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <AdminButton variant="ghost" onClick={close}>
              Cancel
            </AdminButton>
            <AdminButton onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </AdminButton>
          </div>
        </AdminModal>
      )}
    </>
  );
}

export default function AdminMarketPage() {
  return (
    <AdminShell>
      <Market />
    </AdminShell>
  );
}

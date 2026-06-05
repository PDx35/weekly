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
import { DAY_NAMES } from '@/lib/market';

type Draft = {
  day: string;
  area: string;
  zip: string;
  lng: string;
  lat: string;
  discountPercent: string;
};

const emptyDraft = (): Draft => ({
  day: '1',
  area: '',
  zip: '',
  lng: '',
  lat: '',
  discountPercent: '10',
});

type MarketSortKey = 'day' | 'area' | 'zip' | 'discount';

const MARKET_ACCESSORS: Record<MarketSortKey, (m: AdminMarketStop) => string | number | boolean> = {
  day: (m) => ((m.day + 6) % 7), // Mon=0 .. Sun=6
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
      setItems(list);
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
        (m) =>
          (m.area ?? '').toLowerCase().includes(q) || (m.zip ?? '').includes(q),
      );
    }
    if (filterDay !== 'all') list = list.filter((m) => String(m.day) === filterDay);
    return list;
  }, [items, searchQ, filterDay]);

  const { sorted, sort, toggle } = useSort(filtered, MARKET_ACCESSORS, 'day');

  const save = async () => {
    if (!draft) return;
    if (!draft.area.trim() || !draft.zip.trim()) {
      setError('Area and pincode are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      day: Number(draft.day),
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
        One stop per weekday; the covered pincode gets the discount on that day.
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
                  <td className="px-4 py-2.5 font-medium">{DAY_NAMES[m.day] ?? m.day}</td>
                  <td className="px-4 py-2.5">{m.area}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{m.zip}</td>
                  <td className="px-4 py-2.5">{m.discountPercent}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setDraft({
                          day: String(m.day),
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
            <Labeled label="Day">
              <AdminSelect
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: e.target.value })}
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </AdminSelect>
            </Labeled>
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

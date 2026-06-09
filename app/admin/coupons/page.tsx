'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { FilterBar, SortTh, useSort } from '@/components/admin/SortHeader';
import {
  AdminButton,
  AdminCheckbox,
  AdminInput,
  AdminModal,
  AdminPageHeader,
  AdminSelect,
  Labeled,
} from '@/components/admin/ui';
import { createDoc, listAll, removeDoc, updateDocFields } from '@/lib/admin/db';
import type { AdminCoupon } from '@/lib/admin/types';

type Draft = {
  code: string;
  type: 'flat' | 'percent';
  discount: string;
  minOrder: string;
  maxUses: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  code: '',
  type: 'percent',
  discount: '',
  minOrder: '0',
  maxUses: '100',
  isActive: true,
});

type CouponSortKey = 'code' | 'type' | 'discount' | 'minOrder' | 'used' | 'active';

const COUPON_ACCESSORS: Record<CouponSortKey, (c: AdminCoupon) => string | number | boolean> = {
  code: (c) => (c.code ?? '').toLowerCase(),
  type: (c) => c.type ?? '',
  discount: (c) => c.discount ?? 0,
  minOrder: (c) => c.minOrder ?? 0,
  used: (c) => c.usedCount ?? 0,
  active: (c) => c.isActive ?? true,
};

function Coupons() {
  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'yes' | 'no'>('all');
  const [filterType, setFilterType] = useState<'all' | 'flat' | 'percent'>('all');

  const reload = async () => {
    try {
      setItems(await listAll<AdminCoupon>('coupons'));
    } catch {
      setError('Could not load coupons. Check admin access and Firestore rules.');
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
      list = list.filter((c) => (c.code ?? '').toLowerCase().includes(q));
    }
    if (filterActive === 'yes') list = list.filter((c) => c.isActive);
    if (filterActive === 'no') list = list.filter((c) => !c.isActive);
    if (filterType !== 'all') list = list.filter((c) => c.type === filterType);
    return list;
  }, [items, searchQ, filterActive, filterType]);

  const { sorted, sort, toggle } = useSort(filtered, COUPON_ACCESSORS, 'code');

  const save = async () => {
    if (!draft) return;
    const code = (editing?.code ?? draft.code).trim().toUpperCase();
    if (!code || !draft.discount) {
      setError('Code and discount are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      code,
      type: draft.type,
      discount: Number(draft.discount) || 0,
      minOrder: Number(draft.minOrder) || 0,
      maxUses: Number(draft.maxUses) || 0,
      isActive: draft.isActive,
      ...(editing ? {} : { usedCount: 0 }),
    };
    try {
      if (editing) await updateDocFields('coupons', editing.id, payload);
      else await createDoc('coupons', payload, code);
      close();
      await reload();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (c: AdminCoupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await removeDoc('coupons', c.id);
      await reload();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <AdminPageHeader
          title="Coupons"
          action={
            <AdminButton
              onClick={() => {
                setEditing(null);
                setDraft(emptyDraft());
              }}
            >
              + Add coupon
            </AdminButton>
          }
        />
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && items.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FilterBar>
            <AdminInput
              placeholder="Search code…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full sm:!w-44"
            />
            <AdminSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'flat' | 'percent')}
              className="w-full sm:!w-36"
            >
              <option value="all">All types</option>
              <option value="percent">Percent</option>
              <option value="flat">Flat (₹)</option>
            </AdminSelect>
            <AdminSelect
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full sm:!w-36"
            >
              <option value="all">Status</option>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
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
        <p className="text-sm text-neutral-500">No coupons yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No coupons match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white/60 shadow-sm backdrop-blur-xl p-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-neutral-200 bg-white/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <SortTh label="Code" sortKey="code" current={sort} onToggle={toggle} />
                <SortTh label="Type" sortKey="type" current={sort} onToggle={toggle} />
                <SortTh label="Value" sortKey="discount" current={sort} onToggle={toggle} />
                <SortTh label="Min order" sortKey="minOrder" current={sort} onToggle={toggle} />
                <SortTh label="Used" sortKey="used" current={sort} onToggle={toggle} />
                <SortTh label="Active" sortKey="active" current={sort} onToggle={toggle} />
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.map((c) => (
                <tr key={c.id} className="group transition-all duration-200 hover:bg-neutral-50/80 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-0 hover:z-10 cursor-pointer rounded-xl">
                  <td className="px-6 py-4 font-mono font-bold text-neutral-900 transition-colors group-hover:text-emerald-700">
                    <span className="rounded bg-neutral-100 px-2 py-1 uppercase tracking-wider">{c.code}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 capitalize text-xs font-semibold">{c.type}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {c.type === 'percent' ? `${c.discount}%` : `₹${c.discount}`}
                  </td>
                  <td className="px-6 py-4 font-medium">₹{c.minOrder ?? 0}</td>
                  <td className="px-6 py-4 text-neutral-500">
                    <span className="font-semibold text-neutral-800">{c.usedCount ?? 0}</span>
                    <span className="text-xs">
                      {c.maxUses ? ` / ${c.maxUses}` : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="relative flex items-center justify-center size-6 rounded-full bg-neutral-50 border border-neutral-200">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-20 ${c.isActive !== false ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                      <span className={`relative size-2 rounded-full ${c.isActive !== false ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setDraft({
                          code: c.code,
                          type: c.type ?? 'percent',
                          discount: String(c.discount ?? ''),
                          minOrder: String(c.minOrder ?? 0),
                          maxUses: String(c.maxUses ?? 0),
                          isActive: c.isActive ?? true,
                        });
                      }}
                      className="mr-3 font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(c)}
                      className="font-medium text-rose-600 hover:text-rose-700 hover:underline"
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
        <AdminModal title={editing ? 'Edit coupon' : 'New coupon'} onClose={close}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Labeled label="Code">
                <AdminInput
                  value={draft.code}
                  disabled={Boolean(editing)}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE10"
                />
              </Labeled>
            </div>
            <Labeled label="Type">
              <AdminSelect
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft['type'] })}
              >
                <option value="percent">Percent</option>
                <option value="flat">Flat (₹)</option>
              </AdminSelect>
            </Labeled>
            <Labeled label={draft.type === 'percent' ? 'Discount %' : 'Discount ₹'}>
              <AdminInput
                type="number"
                value={draft.discount}
                onChange={(e) => setDraft({ ...draft, discount: e.target.value })}
              />
            </Labeled>
            <Labeled label="Min order (₹)">
              <AdminInput
                type="number"
                value={draft.minOrder}
                onChange={(e) => setDraft({ ...draft, minOrder: e.target.value })}
              />
            </Labeled>
            <Labeled label="Max uses">
              <AdminInput
                type="number"
                value={draft.maxUses}
                onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })}
              />
            </Labeled>
            <div className="col-span-2">
              <AdminCheckbox
                label="Active"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
            </div>
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

export default function AdminCouponsPage() {
  return (
    <AdminShell>
      <Coupons />
    </AdminShell>
  );
}

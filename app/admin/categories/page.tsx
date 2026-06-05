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
import type { AdminCategory } from '@/lib/admin/types';

type Draft = {
  id: string;
  name: string;
  sortOrder: string;
  active: boolean;
  homeIconUrl: string;
  browseIconUrl: string;
};

const emptyDraft = (): Draft => ({
  id: '',
  name: '',
  sortOrder: '0',
  active: true,
  homeIconUrl: '',
  browseIconUrl: '',
});

type CatSortKey = 'name' | 'id' | 'order' | 'active';

const CAT_ACCESSORS: Record<CatSortKey, (c: AdminCategory) => string | number | boolean> = {
  name: (c) => (c.name ?? '').toLowerCase(),
  id: (c) => c.id.toLowerCase(),
  order: (c) => c.sortOrder ?? 0,
  active: (c) => c.active ?? true,
};

function Categories() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'yes' | 'no'>('all');

  const reload = async () => {
    try {
      const c = await listAll<AdminCategory>('categories');
      setItems(c);
    } catch {
      setError('Could not load categories. Check admin access and Firestore rules.');
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
        (c) => (c.name ?? '').toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
      );
    }
    if (filterActive === 'yes') list = list.filter((c) => c.active !== false);
    if (filterActive === 'no') list = list.filter((c) => c.active === false);
    return list;
  }, [items, searchQ, filterActive]);

  const { sorted, sort, toggle } = useSort(filtered, CAT_ACCESSORS, 'order');

  const save = async () => {
    if (!draft) return;
    const id = (editing?.id ?? draft.id).trim();
    if (!id || !draft.name.trim()) {
      setError('A document id and name are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: draft.name.trim(),
      sortOrder: Number(draft.sortOrder) || 0,
      active: draft.active,
      homeIconUrl: draft.homeIconUrl.trim(),
      browseIconUrl: draft.browseIconUrl.trim(),
    };
    try {
      if (editing) await updateDocFields('categories', editing.id, payload);
      else await createDoc('categories', payload, id);
      close();
      await reload();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (c: AdminCategory) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await removeDoc('categories', c.id);
      await reload();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Categories"
        action={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft());
            }}
          >
            + Add category
          </AdminButton>
        }
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && items.length > 0 && (
        <FilterBar>
          <AdminInput
            placeholder="Search name or id…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="!w-52"
          />
          <AdminSelect
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'yes' | 'no')}
            className="!w-36"
          >
            <option value="all">Status</option>
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
          </AdminSelect>
          <span className="text-xs text-neutral-400">
            {sorted.length} of {items.length}
          </span>
        </FilterBar>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No categories yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No categories match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <SortTh label="Name" sortKey="name" current={sort} onToggle={toggle} />
                <SortTh label="Id" sortKey="id" current={sort} onToggle={toggle} />
                <SortTh label="Order" sortKey="order" current={sort} onToggle={toggle} />
                <SortTh label="Active" sortKey="active" current={sort} onToggle={toggle} />
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-neutral-500">{c.id}</td>
                  <td className="px-4 py-2.5">{c.sortOrder ?? 0}</td>
                  <td className="px-4 py-2.5">{c.active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setDraft({
                          id: c.id,
                          name: c.name ?? '',
                          sortOrder: String(c.sortOrder ?? 0),
                          active: c.active ?? true,
                          homeIconUrl: c.homeIconUrl ?? '',
                          browseIconUrl: c.browseIconUrl ?? '',
                        });
                      }}
                      className="mr-3 font-medium text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(c)}
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
        <AdminModal title={editing ? 'Edit category' : 'New category'} onClose={close}>
          <div className="space-y-4">
            {!editing && (
              <Labeled label="Document id (referenced by products, e.g. Grocery100)">
                <AdminInput
                  value={draft.id}
                  onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                />
              </Labeled>
            )}
            <Labeled label="Name">
              <AdminInput
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Labeled>
            <Labeled label="Sort order">
              <AdminInput
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
              />
            </Labeled>
            <Labeled label="Home icon URL">
              <AdminInput
                value={draft.homeIconUrl}
                onChange={(e) => setDraft({ ...draft, homeIconUrl: e.target.value })}
              />
            </Labeled>
            <Labeled label="Browse icon URL">
              <AdminInput
                value={draft.browseIconUrl}
                onChange={(e) => setDraft({ ...draft, browseIconUrl: e.target.value })}
              />
            </Labeled>
            <AdminCheckbox
              label="Active"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
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

export default function AdminCategoriesPage() {
  return (
    <AdminShell>
      <Categories />
    </AdminShell>
  );
}

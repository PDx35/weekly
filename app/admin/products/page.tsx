'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  AdminButton,
  AdminCheckbox,
  AdminInput,
  AdminModal,
  AdminPageHeader,
  AdminSelect,
  AdminTextarea,
  Labeled,
} from '@/components/admin/ui';
import { rupee } from '@/components/ui/Price';
import { createDoc, listAll, removeDoc, updateDocFields } from '@/lib/admin/db';
import type { AdminCategory, AdminProduct } from '@/lib/admin/types';

type Draft = {
  name: string;
  category: string;
  description: string;
  price: string;
  discountPrice: string;
  unit: string;
  stock: string;
  isAvailable: boolean;
  imageUrls: string;
  weight: string;
  pieces: string;
};

const emptyDraft = (categoryId = ''): Draft => ({
  name: '',
  category: categoryId,
  description: '',
  price: '',
  discountPrice: '',
  unit: '',
  stock: '0',
  isAvailable: true,
  imageUrls: '',
  weight: '',
  pieces: '1',
});

const toDraft = (p: AdminProduct): Draft => ({
  name: p.name ?? '',
  category: p.category ?? '',
  description: p.description ?? '',
  price: String(p.price ?? ''),
  discountPrice: p.discountPrice ? String(p.discountPrice) : '',
  unit: p.unit ?? '',
  stock: String(p.stock ?? 0),
  isAvailable: p.isAvailable ?? true,
  imageUrls: (p.imageUrls ?? []).join('\n'),
  weight: p.weight ? String(p.weight) : '',
  pieces: p.pieces ? String(p.pieces) : '1',
});

const parseImages = (text: string): string[] =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      const [p, c] = await Promise.all([
        listAll<AdminProduct>('products'),
        listAll<AdminCategory>('categories'),
      ]);
      setProducts(p.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
      setCategories(c.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    } catch {
      setError('Could not load products. Check admin access and Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load; state set after I/O
    void reload();
  }, []);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft(categories[0]?.id ?? ''));
  };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setDraft(toDraft(p));
  };
  const close = () => {
    setDraft(null);
    setEditing(null);
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.category) {
      setError('Name and category are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: draft.name.trim(),
      category: draft.category,
      description: draft.description.trim(),
      price: Number(draft.price) || 0,
      discountPrice: Number(draft.discountPrice) || 0,
      unit: draft.unit.trim(),
      stock: Number(draft.stock) || 0,
      isAvailable: draft.isAvailable,
      imageUrls: parseImages(draft.imageUrls),
      weight: Number(draft.weight) || 0,
      pieces: Number(draft.pieces) || 1,
    };
    try {
      if (editing) await updateDocFields('products', editing.id, payload);
      else await createDoc('products', payload);
      close();
      await reload();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (p: AdminProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await removeDoc('products', p.id);
      await reload();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Products"
        action={
          <AdminButton onClick={openNew} disabled={categories.length === 0}>
            + Add product
          </AdminButton>
        }
      />
      {categories.length === 0 && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a category first — products need one.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Stock</th>
                <th className="px-4 py-2.5">Available</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{categoryName(p.category)}</td>
                  <td className="px-4 py-2.5">
                    {p.discountPrice && p.discountPrice < p.price ? (
                      <span>
                        {rupee(p.discountPrice)}{' '}
                        <s className="text-neutral-400">{rupee(p.price)}</s>
                      </span>
                    ) : (
                      rupee(p.price ?? 0)
                    )}
                  </td>
                  <td className="px-4 py-2.5">{p.stock ?? 0}</td>
                  <td className="px-4 py-2.5">{p.isAvailable ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-3 font-medium text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(p)}
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
        <AdminModal title={editing ? 'Edit product' : 'New product'} onClose={close}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Labeled label="Name">
                <AdminInput
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Labeled>
            </div>
            <Labeled label="Category">
              <AdminSelect
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </AdminSelect>
            </Labeled>
            <Labeled label="Unit">
              <AdminInput
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="1 kg"
              />
            </Labeled>
            <Labeled label="Price (MRP)">
              <AdminInput
                type="number"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              />
            </Labeled>
            <Labeled label="Discount price">
              <AdminInput
                type="number"
                value={draft.discountPrice}
                onChange={(e) => setDraft({ ...draft, discountPrice: e.target.value })}
                placeholder="0 = none"
              />
            </Labeled>
            <Labeled label="Stock">
              <AdminInput
                type="number"
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
              />
            </Labeled>
            <Labeled label="Pieces">
              <AdminInput
                type="number"
                value={draft.pieces}
                onChange={(e) => setDraft({ ...draft, pieces: e.target.value })}
              />
            </Labeled>
            <div className="col-span-2">
              <Labeled label="Description">
                <AdminTextarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Labeled>
            </div>
            <div className="col-span-2">
              <Labeled label="Image URLs (one per line)">
                <AdminTextarea
                  rows={2}
                  value={draft.imageUrls}
                  onChange={(e) => setDraft({ ...draft, imageUrls: e.target.value })}
                  placeholder="https://…"
                />
              </Labeled>
            </div>
            <div className="col-span-2">
              <AdminCheckbox
                label="Available for sale"
                checked={draft.isAvailable}
                onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })}
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

export default function AdminProductsPage() {
  return (
    <AdminShell>
      <Products />
    </AdminShell>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { FilterBar, SortTh, useSort } from '@/components/admin/SortHeader';
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
import { auth, storage } from '@/lib/firebase/client';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

function ProductImageUploadField({
  value,
  onChange,
  pathPrefix,
}: {
  value: string;
  onChange: (val: string) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const urls = useMemo(() => {
    return value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const fileExt = file.name.split('.').pop() || 'png';
        const safePrefix = pathPrefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'product';
        const fileName = `${safePrefix}-${Date.now()}-${i}.${fileExt}`;
        const storageRef = ref(storage, `images/products/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        newUrls.push(downloadUrl);
      }

      if (newUrls.length > 0) {
        const currentList = value.trim();
        const updated = currentList ? `${currentList}\n${newUrls.join('\n')}` : newUrls.join('\n');
        onChange(updated);
      }
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError('Upload failed. Ensure Storage rules allow writes.');
    } finally {
      setUploading(false);
    }
  };

  const removeUrl = (urlToRemove: string) => {
    const updated = urls.filter((u) => u !== urlToRemove).join('\n');
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Product Images</span>
        <label className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100">
          {uploading ? 'Uploading...' : 'Choose Files'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2">
          {urls.map((url, index) => (
            <div key={index} className="group relative h-16 w-16 overflow-hidden rounded-md border border-neutral-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <Labeled label="Or Edit Image URLs directly (one per line)">
        <AdminTextarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </Labeled>
    </div>
  );
}

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

const SAMPLE_CSV =
  `name,category,description,price,discount_price,unit,stock,is_available,weight,pieces,image_urls
"Alphonso Mango",fruits,"The king of mangoes",420,349,"6 pcs (1.2 kg)",50,true,1200,6,
"Banana Robusta",fruits,"Everyday energy fruit",64,54,"1 kg (5-7 pcs)",100,true,1000,6,
"Farm Fresh Milk",dairy,"Pasteurised toned milk",33,0,"500 ml",200,true,500,1,https://example.com/milk.jpg
`.trim();

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

type ProductSortKey = 'name' | 'category' | 'price' | 'stock' | 'available';

const PRODUCT_ACCESSORS: Record<ProductSortKey, (p: AdminProduct) => string | number | boolean> = {
  name: (p) => (p.name ?? '').toLowerCase(),
  category: (p) => (p.category ?? '').toLowerCase(),
  price: (p) => (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price) ?? 0,
  stock: (p) => p.stock ?? 0,
  available: (p) => p.isAvailable ?? true,
};

function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterAvail, setFilterAvail] = useState<'all' | 'yes' | 'no'>('all');

  const reload = async () => {
    try {
      const [p, c] = await Promise.all([
        listAll<AdminProduct>('products'),
        listAll<AdminCategory>('categories'),
      ]);
      setProducts(p);
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

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const categoryName = (id: string) => catMap.get(id) ?? id;

  // Filter then sort
  const filtered = useMemo(() => {
    let list = products;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(q) ||
          categoryName(p.category).toLowerCase().includes(q),
      );
    }
    if (filterCat !== 'all') list = list.filter((p) => p.category === filterCat);
    if (filterAvail === 'yes') list = list.filter((p) => p.isAvailable);
    if (filterAvail === 'no') list = list.filter((p) => !p.isAvailable);
    return list;
  }, [products, searchQ, filterCat, filterAvail, catMap]);

  const { sorted, sort, toggle } = useSort(filtered, PRODUCT_ACCESSORS, 'name');

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('You must be signed in to import.');
        setImporting(false);
        return;
      }
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Import failed.');
        if (json.errors?.length) setImportResult({ created: 0, errors: json.errors });
      } else {
        setImportResult({ created: json.created, errors: json.errors ?? [] });
        await reload();
      }
    } catch {
      setError('Import failed — network error.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {/* Hidden file input for CSV import */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImport}
      />

      <AdminPageHeader
        title="Products"
        action={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="ghost"
              onClick={downloadSampleCsv}
            >
              ↓ Sample CSV
            </AdminButton>
            <AdminButton
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={categories.length === 0 || importing}
            >
              {importing ? 'Importing…' : '⬆ Import CSV'}
            </AdminButton>
            <AdminButton onClick={openNew} disabled={categories.length === 0}>
              + Add product
            </AdminButton>
          </div>
        }
      />

      {categories.length === 0 && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a category first — products need one.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && products.length > 0 && (
        <FilterBar>
          <AdminInput
            placeholder="Search name…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="!w-52"
          />
          <AdminSelect
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="!w-44"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            value={filterAvail}
            onChange={(e) => setFilterAvail(e.target.value as 'all' | 'yes' | 'no')}
            className="!w-36"
          >
            <option value="all">Availability</option>
            <option value="yes">Available</option>
            <option value="no">Unavailable</option>
          </AdminSelect>
          <span className="text-xs text-neutral-400">
            {sorted.length} of {products.length}
          </span>
        </FilterBar>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products yet.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No products match filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <SortTh label="Name" sortKey="name" current={sort} onToggle={toggle} />
                <SortTh label="Category" sortKey="category" current={sort} onToggle={toggle} />
                <SortTh label="Price" sortKey="price" current={sort} onToggle={toggle} />
                <SortTh label="Stock" sortKey="stock" current={sort} onToggle={toggle} />
                <SortTh label="Available" sortKey="available" current={sort} onToggle={toggle} />
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
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
              <ProductImageUploadField
                value={draft.imageUrls}
                onChange={(val) => setDraft({ ...draft, imageUrls: val })}
                pathPrefix={draft.name || 'product'}
              />
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

      {importResult && (
        <AdminModal title="Import results" onClose={() => setImportResult(null)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-700">
              <b className="text-emerald-700">{importResult.created}</b> product
              {importResult.created !== 1 ? 's' : ''} imported successfully.
            </p>
            {importResult.errors.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-red-600">
                  {importResult.errors.length} row{importResult.errors.length !== 1 ? 's' : ''} skipped:
                </p>
                <ul className="max-h-40 list-inside list-disc overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <AdminButton onClick={() => setImportResult(null)}>Close</AdminButton>
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

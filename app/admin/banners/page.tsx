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
import type { AdminBanner, AdminCategory, AdminProduct } from '@/lib/admin/types';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { useCart } from '@/store/cart';
import { Icon } from '@/components/ui/Icon';

/** Error-styled content for the global toast (red icon over the dark toast pill). */
function errorToast(message: string) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon name="info" size={16} style={{ color: '#f87171' }} />
      {message}
    </span>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  pathPrefix,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const safePrefix = pathPrefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'banner';
      const fileName = `${safePrefix}-${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `images/banners/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError('Upload failed. Ensure Storage rules allow writes.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex gap-2">
        <AdminInput
          placeholder="Paste URL or choose a file…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value && (
        <div className="mt-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-12 w-24 rounded border border-neutral-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

/** Neutral placeholder shown when a banner has no thumbnail. */
function Thumb({ src }: { src?: string }) {
  if (!src) {
    return (
      <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 text-neutral-300">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-10 w-16 shrink-0 rounded border border-neutral-200 object-cover" />;
}

type Draft = {
  title: string;
  subtitle: string;
  imageUrlDesktop: string;
  imageUrlMobile: string;
  bgColor: string;
  ctaText: string;
  ctaColor: string;
  type: AdminBanner['type'];
  targetType: AdminBanner['targetType'];
  targetValue: string;
  active: boolean;
  priority: string;
  startDate: string;
  endDate: string;
};

const emptyDraft = (): Draft => ({
  title: '',
  subtitle: '',
  imageUrlDesktop: '',
  imageUrlMobile: '',
  bgColor: '#10b981',
  ctaText: 'Shop Now',
  ctaColor: '#ffffff',
  type: 'hero',
  targetType: 'category',
  targetValue: '',
  active: true,
  priority: '0',
  startDate: '',
  endDate: '',
});

type BannerSortKey = 'title' | 'type' | 'priority' | 'active';

const BANNER_ACCESSORS: Record<BannerSortKey, (b: AdminBanner) => string | number | boolean> = {
  title: (b) => (b.title ?? '').toLowerCase(),
  type: (b) => (b.type ?? '').toLowerCase(),
  priority: (b) => b.priority ?? 0,
  active: (b) => b.active ?? true,
};

function BannersManager() {
  const { showToast } = useCart();
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [searchQ, setSearchQ] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'yes' | 'no'>('all');

  const reload = async () => {
    try {
      const [bList, catList, prodList] = await Promise.all([
        listAll<AdminBanner>('banners'),
        listAll<AdminCategory>('categories'),
        listAll<AdminProduct>('products'),
      ]);
      setItems(bList);
      setCategories(catList);
      setProducts(prodList);
    } catch {
      setError('Could not load banners data. Check Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        (b) => (b.title ?? '').toLowerCase().includes(q) || (b.subtitle ?? '').toLowerCase().includes(q),
      );
    }
    if (filterType !== 'all') {
      list = list.filter((b) => b.type === filterType);
    }
    if (filterActive === 'yes') list = list.filter((b) => b.active !== false);
    if (filterActive === 'no') list = list.filter((b) => b.active === false);
    return list;
  }, [items, searchQ, filterType, filterActive]);

  const { sorted, sort, toggle } = useSort(filtered, BANNER_ACCESSORS, 'priority');

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.imageUrlDesktop.trim()) {
      showToast(errorToast('Banner Title and Desktop Image URL are required.'));
      return;
    }
    setSaving(true);

    const payload: Omit<AdminBanner, 'id'> = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      imageUrlDesktop: draft.imageUrlDesktop.trim(),
      imageUrlMobile: (draft.imageUrlMobile || draft.imageUrlDesktop).trim(),
      bgColor: draft.bgColor.trim(),
      ctaText: draft.ctaText.trim(),
      ctaColor: draft.ctaColor.trim(),
      type: draft.type,
      targetType: draft.targetType,
      targetValue: draft.targetValue.trim(),
      active: draft.active,
      priority: Number(draft.priority) || 0,
      startDate: draft.startDate || undefined,
      endDate: draft.endDate || undefined,
      views: editing?.views ?? 0,
      clicks: editing?.clicks ?? 0,
    };

    try {
      if (editing) {
        await updateDocFields('banners', editing.id, payload as any);
        showToast('Banner updated successfully!');
      } else {
        await createDoc('banners', payload as any);
        showToast('Banner created successfully!');
      }
      close();
      await reload();
    } catch {
      showToast(errorToast('Saving banner failed.'));
    } finally {
      setSaving(false);
    }
  };

  const del = async (b: AdminBanner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    try {
      await removeDoc('banners', b.id);
      showToast('Banner deleted');
      await reload();
    } catch {
      showToast(errorToast('Delete banner failed.'));
    }
  };

  const adjustPriority = async (b: AdminBanner, amount: number) => {
    try {
      const nextPriority = Math.max(0, (b.priority ?? 0) + amount);
      await updateDocFields('banners', b.id, { priority: nextPriority });
      await reload();
      showToast('Banner order updated');
    } catch {
      showToast(errorToast('Failed to update banner order'));
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Banners & Promotions"
        action={
          <AdminButton
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft());
            }}
          >
            + Add Banner
          </AdminButton>
        }
      />
      {!loading && items.length > 0 && (
        <FilterBar>
          <AdminInput
            placeholder="Search banner title…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="!w-52"
          />
          <AdminSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="!w-44"
          >
            <option value="all">All Placements</option>
            <option value="hero">Home Hero Banner</option>
            <option value="promo">Promotional Banners</option>
            <option value="category">Category Banners</option>
            <option value="offer">Offer Banners</option>
            <option value="brand">Brand Banners</option>
            <option value="seasonal">Seasonal Banners</option>
            <option value="mid_page">Mid-Page Banners</option>
            <option value="footer">Footer Promo Banners</option>
          </AdminSelect>
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
        <p className="text-sm text-neutral-500">Loading Banners…</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No banners defined yet. Click &quot;Add Banner&quot; above to create one.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No banners matching criteria.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              <tr>
                <SortTh label="Banner" sortKey="title" current={sort} onToggle={toggle} />
                <SortTh label="Placement" sortKey="type" current={sort} onToggle={toggle} />
                <SortTh label="Priority" sortKey="priority" current={sort} onToggle={toggle} />
                <SortTh label="Status" sortKey="active" current={sort} onToggle={toggle} />
                <th className="px-4 py-3 font-medium">Performance</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const views = b.views ?? 0;
                const clicks = b.clicks ?? 0;
                const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0.0%';

                return (
                  <tr key={b.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={b.imageUrlDesktop} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-neutral-900">
                            {b.title || <span className="italic text-neutral-400">Untitled</span>}
                          </div>
                          {b.subtitle && (
                            <div className="mt-0.5 truncate text-xs text-neutral-500">{b.subtitle}</div>
                          )}
                          <div className="mt-1 text-xs text-neutral-400">
                            Links to {b.targetType} · {b.targetValue || 'none'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-600">
                      {(b.type ?? '').replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-medium text-neutral-900">{b.priority ?? 0}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => adjustPriority(b, 1)}
                            aria-label="Increase priority"
                            className="flex h-3.5 w-4 items-center justify-center rounded-t border border-neutral-200 text-[8px] leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => adjustPriority(b, -1)}
                            aria-label="Decrease priority"
                            className="flex h-3.5 w-4 items-center justify-center rounded-b border border-t-0 border-neutral-200 text-[8px] leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${b.active ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                        />
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-700">
                        {clicks} clicks / {views} views
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-400">CTR {ctr}</div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(b);
                          setDraft({
                            title: b.title ?? '',
                            subtitle: b.subtitle ?? '',
                            imageUrlDesktop: b.imageUrlDesktop ?? '',
                            imageUrlMobile: b.imageUrlMobile ?? '',
                            bgColor: b.bgColor ?? '#10b981',
                            ctaText: b.ctaText ?? 'Shop Now',
                            ctaColor: b.ctaColor ?? '#ffffff',
                            type: b.type ?? 'hero',
                            targetType: b.targetType ?? 'category',
                            targetValue: b.targetValue ?? '',
                            active: b.active ?? true,
                            priority: String(b.priority ?? 0),
                            startDate: b.startDate ?? '',
                            endDate: b.endDate ?? '',
                          });
                        }}
                        className="mr-4 font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(b)}
                        className="font-medium text-neutral-500 hover:text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <AdminModal title={editing ? 'Edit Banner' : 'New Banner'} onClose={close} size="2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
            
            {/* Left side settings */}
            <div className="space-y-4">
              <Labeled label="Banner Title">
                <AdminInput
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. 50% Off Fresh Fruits"
                />
              </Labeled>

              <Labeled label="Banner Subtitle / Heading Tint">
                <AdminInput
                  value={draft.subtitle}
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                  placeholder="e.g. Handpicked organic apples"
                />
              </Labeled>

              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Placement Type">
                  <AdminSelect
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as any })}
                  >
                    <option value="hero">Home Hero Banner</option>
                    <option value="promo">Promotional Banners</option>
                    <option value="category">Category Banners</option>
                    <option value="offer">Offer Banners</option>
                    <option value="brand">Brand Banners</option>
                    <option value="seasonal">Seasonal Banners</option>
                    <option value="mid_page">Mid-Page Banners</option>
                    <option value="footer">Footer Promo Banners</option>
                  </AdminSelect>
                </Labeled>

                <Labeled label="Display Order/Priority">
                  <AdminInput
                    type="number"
                    value={draft.priority}
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  />
                </Labeled>
              </div>

              <ImageUploadField
                label="Desktop Image (Landscape)"
                value={draft.imageUrlDesktop}
                onChange={(val) => setDraft({ ...draft, imageUrlDesktop: val })}
                pathPrefix={`${draft.title || 'banner'}-desktop`}
              />

              <ImageUploadField
                label="Mobile Image (Portrait/Square)"
                value={draft.imageUrlMobile}
                onChange={(val) => setDraft({ ...draft, imageUrlMobile: val })}
                pathPrefix={`${draft.title || 'banner'}-mobile`}
              />

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Labeled label="Background Color">
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color"
                        value={draft.bgColor.startsWith('#') ? draft.bgColor : '#10b981'}
                        onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                        className="h-9 w-9 border border-neutral-300 rounded cursor-pointer shrink-0"
                      />
                      <AdminInput
                        value={draft.bgColor}
                        onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })}
                        placeholder="e.g. #10b981"
                      />
                    </div>
                  </Labeled>
                </div>
                <div>
                  <Labeled label="CTA Text">
                    <AdminInput
                      value={draft.ctaText}
                      onChange={(e) => setDraft({ ...draft, ctaText: e.target.value })}
                    />
                  </Labeled>
                </div>
              </div>

              {/* Target linking fields */}
              <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Action Target (Redirection)
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Labeled label="Action Target">
                    <AdminSelect
                      value={draft.targetType}
                      onChange={(e) => setDraft({ ...draft, targetType: e.target.value as any, targetValue: '' })}
                    >
                      <option value="category">Category Page</option>
                      <option value="product">Product Page</option>
                      <option value="search">Search Page</option>
                      <option value="url">External / Custom URL</option>
                    </AdminSelect>
                  </Labeled>

                  {/* Redirection field depends on Target Type */}
                  {draft.targetType === 'category' && (
                    <Labeled label="Category Link">
                      <AdminSelect
                        value={draft.targetValue}
                        onChange={(e) => setDraft({ ...draft, targetValue: e.target.value })}
                      >
                        <option value="">Choose category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </AdminSelect>
                    </Labeled>
                  )}

                  {draft.targetType === 'product' && (
                    <Labeled label="Product Link">
                      <AdminSelect
                        value={draft.targetValue}
                        onChange={(e) => setDraft({ ...draft, targetValue: e.target.value })}
                      >
                        <option value="">Choose product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                        ))}
                      </AdminSelect>
                    </Labeled>
                  )}

                  {draft.targetType === 'search' && (
                    <Labeled label="Search Query">
                      <AdminInput
                        value={draft.targetValue}
                        onChange={(e) => setDraft({ ...draft, targetValue: e.target.value })}
                        placeholder="e.g. apple"
                      />
                    </Labeled>
                  )}

                  {draft.targetType === 'url' && (
                    <Labeled label="URL Value">
                      <AdminInput
                        value={draft.targetValue}
                        onChange={(e) => setDraft({ ...draft, targetValue: e.target.value })}
                        placeholder="e.g. https://weeklymarket.com/promo"
                      />
                    </Labeled>
                  )}
                </div>
              </div>

            </div>

            {/* Right side live preview and scheduling */}
            <div className="space-y-6">
              
              {/* Scheduling Banner */}
              <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Publishing Schedule
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Labeled label="Start Date (Optional)">
                    <AdminInput
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                    />
                  </Labeled>
                  <Labeled label="End Date (Optional)">
                    <AdminInput
                      type="date"
                      value={draft.endDate}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                    />
                  </Labeled>
                </div>
              </div>

              {/* LIVE MOCKUP PREVIEW */}
              <div className="space-y-2">
                <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Live Preview
                </span>
                <div
                  className="relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 p-6 text-left"
                  style={{ backgroundColor: draft.bgColor || '#10b981' }}
                >
                  {draft.imageUrlDesktop && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.imageUrlDesktop}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                  )}

                  <div className="z-10 max-w-[75%]">
                    {draft.subtitle && (
                      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/85">
                        {draft.subtitle}
                      </span>
                    )}
                    <h3 className="text-xl font-semibold leading-tight text-white drop-shadow-sm">
                      {draft.title || 'Banner title'}
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="z-10 w-max rounded-md bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm"
                    style={{ color: draft.ctaColor && draft.ctaColor !== '#ffffff' ? draft.ctaColor : undefined }}
                  >
                    {draft.ctaText || 'Shop Now'}
                  </button>
                </div>
              </div>

              {/* Status active checkbox */}
              <AdminCheckbox
                label="Make Active immediately"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />

              {editing && (
                <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Performance Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-neutral-500">Total Views</span>
                      <div className="text-lg font-semibold tabular-nums text-neutral-900">{editing.views ?? 0}</div>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Total Clicks</span>
                      <div className="text-lg font-semibold tabular-nums text-neutral-900">{editing.clicks ?? 0}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-neutral-200 pt-4">
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

export default function AdminBannersPage() {
  return (
    <AdminShell>
      <BannersManager />
    </AdminShell>
  );
}

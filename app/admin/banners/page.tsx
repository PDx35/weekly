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
import { useCart } from '@/store/cart';

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

      // 1. Get presigned URL
      const res = await fetch('/api/admin/s3-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileName, contentType: file.type }),
      });
      
      if (!res.ok) throw new Error('Failed to get presigned URL');
      const { url, publicUrl } = await res.json();

      // 2. Upload directly to S3
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload to S3');

      onChange(publicUrl);
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError('Upload failed. Check AWS credentials and S3 CORS policy.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex gap-2">
        <AdminInput
          placeholder="Paste URL or choose a file..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100">
          {uploading ? 'Uploading...' : 'Upload'}
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
        <div className="flex items-center gap-2 mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-12 w-24 rounded object-cover border border-neutral-200" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
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
      setError('Banner Title and Desktop Image URL are required.');
      return;
    }
    setSaving(true);
    setError('');

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
      setError('Saving banner failed.');
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
      setError('Delete banner failed.');
    }
  };

  const adjustPriority = async (b: AdminBanner, amount: number) => {
    try {
      const nextPriority = Math.max(0, (b.priority ?? 0) + amount);
      await updateDocFields('banners', b.id, { priority: nextPriority });
      await reload();
      showToast('Banner order updated');
    } catch {
      setError('Failed to update banner order');
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
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
      </div>
      {error && <p className="mb-4 text-sm text-red-600 font-bold">{error}</p>}

      {!loading && items.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FilterBar>
            <AdminInput
              placeholder="Search banner title…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full sm:!w-52"
            />
            <AdminSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:!w-44"
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
        <p className="text-sm text-neutral-500">Loading Banners…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">No banners defined yet. Click &quot;Add Banner&quot; above to create one.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No banners matching criteria.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white/60 shadow-sm backdrop-blur-xl p-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-neutral-200 bg-white/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <SortTh label="Banner Details" sortKey="title" current={sort} onToggle={toggle} />
                <SortTh label="Placement" sortKey="type" current={sort} onToggle={toggle} />
                <SortTh label="Priority" sortKey="priority" current={sort} onToggle={toggle} />
                <SortTh label="Active" sortKey="active" current={sort} onToggle={toggle} />
                <th className="px-6 py-4">Performance (CTR)</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.map((b) => {
                const views = b.views ?? 0;
                const clicks = b.clicks ?? 0;
                const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0.0%';
                
                return (
                  <tr key={b.id} className="group transition-all duration-200 hover:bg-neutral-50/80 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-0 hover:z-10 cursor-pointer rounded-xl">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.imageUrlDesktop} alt="" className="h-12 w-20 object-cover rounded-lg border border-neutral-200 shadow-sm transition-transform duration-300 group-hover:scale-105" />
                        <div>
                          <div className="font-semibold text-neutral-900 leading-tight group-hover:text-emerald-700 transition-colors">{b.title}</div>
                          {b.subtitle && <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">{b.subtitle}</div>}
                          <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                            Links: {b.targetType} ({b.targetValue || 'none'})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-bold text-neutral-600 text-xs">{(b.type || 'hero').replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-neutral-100 rounded px-2 py-0.5">{b.priority ?? 0}</span>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => adjustPriority(b, 1)} className="text-[8px] bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-900">▲</button>
                          <button onClick={() => adjustPriority(b, -1)} className="text-[8px] bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-900">▼</button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {b.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-neutral-800">
                        {clicks} clicks / {views} views
                      </div>
                      <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">CTR: {ctr}</div>
                    </td>
                    <td className="px-6 py-4 text-right opacity-0 transition-opacity group-hover:opacity-100">
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
                        className="mr-3 font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(b)}
                        className="font-medium text-rose-600 hover:text-rose-700 hover:underline"
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
        <AdminModal title={editing ? 'Edit Banner' : 'New Banner'} onClose={close}>
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
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-4">
                <div className="text-xs font-bold text-neutral-800">Banner Action Target (Redirection)</div>
                
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
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-4">
                <div className="text-xs font-bold text-neutral-800">Publishing Schedule</div>
                
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
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest block">Live Visual Preview</span>
                <div 
                  className="w-full h-44 rounded-2xl p-6 flex flex-col justify-between text-left overflow-hidden relative shadow-md"
                  style={{ backgroundColor: draft.bgColor || '#10b981' }}
                >
                  {draft.imageUrlDesktop && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={draft.imageUrlDesktop} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none transition-opacity duration-300" 
                    />
                  )}
                  
                  <div className="z-10 bg-white/10 backdrop-blur-xs p-3 rounded-xl max-w-[70%] border border-white/10 shadow-sm">
                    {draft.subtitle && (
                      <span className="text-[10px] uppercase font-black tracking-widest text-white/90 block leading-none mb-1">
                        {draft.subtitle}
                      </span>
                    )}
                    <h3 className="font-black text-lg sm:text-xl uppercase text-white leading-tight">
                      {draft.title || 'BANNER TITLE'}
                    </h3>
                  </div>

                  <button 
                    type="button"
                    className="z-10 bg-amber-400 text-neutral-950 font-black text-xs px-4 py-2 rounded-full w-max shadow transition-transform hover:scale-105"
                    style={{ color: draft.ctaColor || '#000000' }}
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
                <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-1">
                  <div className="text-xs font-bold text-neutral-500">Banner Performance Metrics</div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total Views</span>
                      <div className="text-lg font-black text-neutral-900">{editing.views ?? 0}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total Clicks</span>
                      <div className="text-lg font-black text-neutral-900">{editing.clicks ?? 0}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          <div className="mt-5 flex justify-end gap-2 border-t pt-4">
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

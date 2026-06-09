'use client';

import { useMemo, useState } from 'react';
import {
  ActiveDot,
  Bar,
  Dot,
  EvilComposedChart,
  Grid,
  Legend as ComposedLegend,
  Line,
  Tooltip as ComposedTooltip,
  XAxis,
  YAxis,
} from '@/components/evilcharts/charts/composed-chart';
import {
  EvilPieChart,
  Legend as PieLegend,
  Pie,
  Tooltip as PieTooltip,
} from '@/components/evilcharts/charts/pie-chart';
import type { ChartConfig } from '@/components/evilcharts/ui/chart';
import { AdminSelect } from '@/components/admin/ui';
import type { AdminCategory, AdminProduct } from '@/lib/admin/types';
import type { Order } from '@/lib/types';
import { rupee } from '@/components/ui/Price';

type Range = '3d' | '3m' | '6m';

const RANGE_LABEL: Record<Range, string> = {
  '3d': 'Last 3 days',
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
};

const PALETTE = [
  '#34d399',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#14b8a6',
];

/** Normalise a placedAt/createdAt value (number ms or Firestore Timestamp) to ms. */
function toMillis(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const o = v as { toMillis?: () => number; seconds?: number };
    if (typeof o.toMillis === 'function') return o.toMillis();
    if (typeof o.seconds === 'number') return o.seconds * 1000;
  }
  return 0;
}

function orderMillis(o: Order): number {
  const anyO = o as unknown as { placedAt?: unknown; createdAt?: unknown };
  return toMillis(anyO.placedAt) || toMillis(anyO.createdAt);
}

function orderRevenue(o: Order): number {
  const anyO = o as unknown as { totals?: { grand?: number }; total?: number };
  return anyO.totals?.grand ?? anyO.total ?? 0;
}

const compactRupee = (v: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

/** Buckets ("3d" → 3 daily, "3m"/"6m" → monthly) and the key→bucket mapper for a range. */
function buildBuckets(range: Range) {
  const now = new Date();
  const daily = range === '3d';
  const keyOf = (ms: number) => {
    const d = new Date(ms);
    return daily
      ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      : `${d.getFullYear()}-${d.getMonth()}`;
  };

  const count = daily ? 3 : range === '3m' ? 3 : 6;
  const buckets = Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    const d = daily
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
      : new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      key: keyOf(d.getTime()),
      label: daily
        ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short' })
        : d.toLocaleString('en-IN', { month: 'short' }),
    };
  });

  return { buckets, keyOf, startMs: bucketStartMs(buckets[0]?.key ?? '', daily) };
}

/** First-instant ms of the earliest bucket, used as the range's lower bound. */
function bucketStartMs(key: string, daily: boolean): number {
  const parts = key.split('-').map(Number);
  if (daily) return new Date(parts[0], parts[1], parts[2]).getTime();
  return new Date(parts[0], parts[1], 1).getTime();
}

const composedConfig = {
  orders: { label: 'Orders', colors: { light: ['#34d399', '#059669'] } },
  revenue: { label: 'Revenue', colors: { light: ['#818cf8', '#6366f1'] } },
} satisfies ChartConfig;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {children}
    </div>
  );
}

interface Props {
  orders: Order[];
  products: AdminProduct[];
  categories: AdminCategory[];
}

export function DashboardCharts({ orders, products, categories }: Props) {
  const [range, setRange] = useState<Range>('6m');

  const series = useMemo(() => {
    const { buckets, keyOf } = buildBuckets(range);
    const rows = buckets.map((b) => ({ period: b.label, orders: 0, revenue: 0 }));
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of orders) {
      const ms = orderMillis(o);
      if (!ms) continue;
      const i = idx.get(keyOf(ms));
      if (i == null) continue;
      rows[i].orders += 1;
      rows[i].revenue += orderRevenue(o);
    }
    return rows;
  }, [orders, range]);

  const { categoryData, categoryConfig, catName } = useMemo(() => {
    const { startMs } = buildBuckets(range);
    const productCat = new Map(products.map((p) => [p.id, p.category]));
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    const totals = new Map<string, number>();

    for (const o of orders) {
      const ms = orderMillis(o);
      if (!ms || ms < startMs) continue;
      const items = (o.items ?? []) as { productId?: string; price?: number; qty?: number }[];
      for (const it of items) {
        const catId = productCat.get(it.productId ?? '') ?? 'other';
        totals.set(catId, (totals.get(catId) ?? 0) + (it.price ?? 0) * (it.qty ?? 0));
      }
    }

    const data = [...totals.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const config: ChartConfig = {};
    data.forEach((d, i) => {
      config[d.name] = {
        label: catName.get(d.name) ?? (d.name === 'other' ? 'Other' : d.name),
        colors: { light: [PALETTE[i % PALETTE.length]] },
      };
    });

    return { categoryData: data, categoryConfig: config, catName };
  }, [orders, products, categories, range]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.totals?.grand ?? 0) : 0), 0);
  const totalOrders = orders.filter(o => o.status !== 'cancelled').length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingRev = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.totals?.grand ?? 0), 0);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-end">
        <AdminSelect
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="h-8 w-40"
        >
          <option value="3d">Last 3 days</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
        </AdminSelect>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Hero Card */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-neutral-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex flex-col flex-1 gap-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Dashboard</h2>
                <p className="text-xs text-neutral-500">Overview of {RANGE_LABEL[range]}</p>
              </div>
              <div className="mt-2">
                <h1 className="text-4xl font-bold text-neutral-900">{rupee(totalRevenue)}</h1>
                <p className="text-xs text-neutral-500 mt-1">Current Period Earnings</p>
              </div>
              <div className="mt-2">
                <h2 className="text-2xl font-bold text-neutral-900">{totalOrders}</h2>
                <p className="text-xs text-neutral-500 mt-1">Current Period Sales</p>
              </div>
              <button className="mt-4 w-fit rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition-colors">
                Period Summary
              </button>
            </div>
            
            <div className="flex-[2] h-[260px]">
              <EvilComposedChart config={composedConfig} data={series} className="h-full w-full">
                <Grid />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" allowDecimals={false} width={32} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={48}
                  tickFormatter={(v: number) => compactRupee(v)}
                />
                <ComposedTooltip />
                <ComposedLegend isClickable />
                <Bar dataKey="orders" barProps={{ yAxisId: 'left', fill: '#34d399' }} />
                <Line dataKey="revenue" glow lineProps={{ yAxisId: 'right', stroke: '#10b981' }}>
                  <Dot />
                  <ActiveDot />
                </Line>
              </EvilComposedChart>
            </div>
          </div>
          
          {/* Bottom 4 Stats inside the same card */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-neutral-200/50 mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Total Revenue</p>
                <p className="text-sm font-bold text-neutral-900">{rupee(totalRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Average Order</p>
                <p className="text-sm font-bold text-neutral-900">{rupee(avgOrder)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Sales Volume</p>
                <p className="text-sm font-bold text-neutral-900">{totalOrders}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Pending Rev</p>
                <p className="text-sm font-bold text-neutral-900">{rupee(pendingRev)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pie Chart */}
        <div className="flex flex-col rounded-2xl border border-neutral-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
          <h3 className="text-base font-semibold text-neutral-900 mb-6">Sales Traffic</h3>
          {categoryData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
              No category sales in this range yet.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <EvilPieChart
                config={categoryConfig}
                data={categoryData}
                dataKey="value"
                nameKey="name"
                className="h-60 w-full"
              >
                <PieTooltip />
                <Pie innerRadius="65%" outerRadius="90%" paddingAngle={4} cornerRadius={6} />
              </EvilPieChart>
              
              <div className="grid grid-cols-3 gap-2 mt-6">
                {categoryData.slice(0, 3).map((d, i) => {
                  const total = categoryData.reduce((s, c) => s + c.value, 0);
                  const perc = Math.round((d.value / total) * 100);
                  return (
                    <div key={d.name} className="flex flex-col items-center text-center">
                      <div className="text-lg font-bold text-neutral-900">{perc}%</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="size-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="text-[10px] text-neutral-500 truncate max-w-[60px]" title={catName.get(d.name) ?? d.name}>
                          {catName.get(d.name) ?? d.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

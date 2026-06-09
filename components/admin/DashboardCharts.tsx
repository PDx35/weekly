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
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
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

  const { categoryData, categoryConfig } = useMemo(() => {
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

    return { categoryData: data, categoryConfig: config };
  }, [orders, products, categories, range]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-end">
        <AdminSelect
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="h-8 w-40"
          aria-label="Time range"
        >
          <option value="3d">Last 3 days</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
        </AdminSelect>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title={`Orders & revenue · ${RANGE_LABEL[range]}`}>
            <EvilComposedChart config={composedConfig} data={series} className="h-[300px] w-full mt-2">
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
              <Bar dataKey="orders" barProps={{ yAxisId: 'left' }} />
              <Line dataKey="revenue" glow lineProps={{ yAxisId: 'right' }}>
                <Dot />
                <ActiveDot />
              </Line>
            </EvilComposedChart>
          </ChartCard>
        </div>

        <div>
          <ChartCard title={`Category sales · ${RANGE_LABEL[range]}`}>
          {categoryData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
              No category sales in this range yet.
            </div>
          ) : (
            <EvilPieChart
              config={categoryConfig}
              data={categoryData}
              dataKey="value"
              nameKey="name"
              className="h-72 w-full"
            >
              <PieTooltip />
              <Pie innerRadius="55%" outerRadius="80%" paddingAngle={2} cornerRadius={4} />
              <PieLegend />
            </EvilPieChart>
          )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

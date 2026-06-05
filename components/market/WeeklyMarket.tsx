'use client';

import dynamic from 'next/dynamic';
import type { MarketDay } from '@/lib/types';

/**
 * Lazily loads the interactive map client-side only (`ssr: false`), so MapLibre
 * never runs during SSR. Renders a sized skeleton while the map chunk loads.
 */
const WeeklyMarketClient = dynamic(
  () => import('./WeeklyMarketClient').then((m) => m.WeeklyMarketClient),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr]">
        <div
          className="h-[280px] animate-pulse rounded-[var(--radius-card)]"
          style={{ background: 'var(--line-2)' }}
        />
        <div
          className="h-[360px] animate-pulse rounded-[var(--radius-card)] md:h-[520px]"
          style={{ background: 'var(--line-2)' }}
        />
      </div>
    ),
  },
);

export function WeeklyMarket({ schedule }: { schedule: MarketDay[] }) {
  return <WeeklyMarketClient schedule={schedule} />;
}

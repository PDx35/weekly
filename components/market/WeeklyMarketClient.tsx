'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerTooltip,
  type MapRef,
} from '@/components/ui/map';
import { MARKET_MAP_CENTER, MARKET_MAP_ZOOM, dayName, marketsForZip } from '@/lib/market';
import type { MarketDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

/** Result of a pincode lookup: the matching stops (usually one) or none. */
type ZipResult = { zip: string; matches: MarketDay[] } | null;

/**
 * Weekly market map + pincode search (client-only — owns the MapLibre map).
 * Highlights today's market stop and lets shoppers check when the market
 * reaches their pincode and what discount it unlocks.
 */
export function WeeklyMarketClient({ schedule }: { schedule: MarketDay[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const { addresses, selectedAddr } = useAuth();
  const myZip = (addresses.find((a) => a.id === selectedAddr) ?? addresses[0])?.pin;

  // Rendered client-only, so the local weekday is always correct (no SSR skew).
  const todayIndex = new Date().getDay();
  const today = useMemo(
    () => schedule.find((m) => m.day === todayIndex) ?? null,
    [schedule, todayIndex],
  );

  const initialCenter: [number, number] = today ? [today.lng, today.lat] : MARKET_MAP_CENTER;

  const [zip, setZip] = useState('');
  const [result, setResult] = useState<ZipResult>(null);
  const [selectedZip, setSelectedZip] = useState<string | null>(today?.zip ?? null);

  const focus = (m: MarketDay) => {
    setSelectedZip(m.zip);
    mapRef.current?.flyTo({ center: [m.lng, m.lat], zoom: 13, duration: 1200 });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const z = zip.trim();
    if (!/^\d{6}$/.test(z)) {
      setResult({ zip: z, matches: [] });
      return;
    }
    const matches = marketsForZip(z, schedule);
    setResult({ zip: z, matches });
    if (matches[0]) focus(matches[0]);
  };

  const isToday = (m: MarketDay) => m.day === todayIndex;
  const myMarketToday = today && today.zip === myZip ? today : null;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr]">
      {/* Info + search panel */}
      <div className="flex flex-col gap-3">
        {today ? (
          <div
            className="rounded-[var(--radius-card)] p-4 text-white"
            style={{ background: 'linear-gradient(135deg,var(--brand),var(--brand-700))' }}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-semibold opacity-90">
              <Icon name="bolt" size={14} /> Market is here today · {dayName(todayIndex)}
            </span>
            <p className="mt-1.5 font-[family-name:var(--font-head)] text-xl font-bold">
              {today.area} · {today.zip}
            </p>
            <p className="mt-1 text-sm opacity-90">
              Get <b>{today.discountPercent}% off</b> on orders delivered here today.
            </p>
            {myMarketToday && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[13px] font-semibold">
                <Icon name="check" size={14} /> That&apos;s your saved area — you unlock{' '}
                {myMarketToday.discountPercent}% off!
              </p>
            )}
          </div>
        ) : (
          <div
            className="rounded-[var(--radius-card)] border p-4"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
          >
            <p className="font-[family-name:var(--font-head)] font-semibold">No market today</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
              Check below to see which day the market reaches your pincode.
            </p>
          </div>
        )}

        {/* Pincode search */}
        <form onSubmit={onSearch} className="promo-box !mt-0">
          <Icon name="pin" size={18} />
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter your 6-digit pincode"
            aria-label="Pincode"
          />
          <button type="submit">Check</button>
        </form>

        {result && (
          <div
            className="rounded-[var(--radius-card)] border p-3.5 text-sm"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
          >
            {result.matches.length === 0 ? (
              <p style={{ color: 'var(--ink-2)' }}>
                No FreshMart weekly market in{' '}
                <b style={{ color: 'var(--ink)' }}>{result.zip || 'that pincode'}</b> yet.
                We&apos;re expanding every week!
              </p>
            ) : (
              result.matches.map((m) => (
                <p key={m.zip} style={{ color: 'var(--ink-2)' }}>
                  The market visits <b style={{ color: 'var(--ink)' }}>{m.area}</b> ({m.zip}) every{' '}
                  <b style={{ color: 'var(--ink)' }}>{dayName(m.day)}</b>.{' '}
                  {isToday(m) ? (
                    <span style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
                      It&apos;s here today — {m.discountPercent}% off!
                    </span>
                  ) : (
                    <>
                      Come back {dayName(m.day)} for {m.discountPercent}% off.
                    </>
                  )}
                </p>
              ))
            )}
          </div>
        )}

        {/* Full weekly schedule */}
        <div
          className="overflow-hidden rounded-[var(--radius-card)] border"
          style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
        >
          {schedule.map((m) => {
            const active = selectedZip === m.zip;
            const todayRow = isToday(m);
            return (
              <button
                key={m.zip}
                type="button"
                onClick={() => focus(m)}
                className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-b-0"
                style={{
                  borderColor: 'var(--line-2)',
                  background: active ? 'var(--brand-050)' : 'transparent',
                }}
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{
                    background: todayRow ? 'var(--brand)' : 'var(--line-2)',
                    color: todayRow ? '#fff' : 'var(--ink-2)',
                  }}
                >
                  {dayName(m.day).slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                    {m.area}
                  </b>
                  <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                    {m.zip} · {dayName(m.day)}
                  </span>
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[12px] font-bold"
                  style={{ background: 'var(--accent-soft)', color: '#9A6B16' }}
                >
                  {m.discountPercent}% off
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div
        className="h-[360px] overflow-hidden rounded-[var(--radius-card)] border md:h-[520px]"
        style={{ borderColor: 'var(--line)' }}
      >
        <Map ref={mapRef} center={initialCenter} zoom={MARKET_MAP_ZOOM} theme="light">
          <MapControls position="bottom-right" showZoom />
          {schedule.map((m) => {
            const todayMarker = isToday(m);
            const active = selectedZip === m.zip;
            return (
              <MapMarker key={m.zip} longitude={m.lng} latitude={m.lat} onClick={() => focus(m)}>
                <MarkerContent>
                  {todayMarker ? (
                    <div className="relative grid place-items-center">
                      <span
                        className="absolute size-9 animate-ping rounded-full opacity-30"
                        style={{ background: 'var(--brand)' }}
                      />
                      <span
                        className="relative grid size-7 place-items-center rounded-full text-white shadow-lg ring-2 ring-white"
                        style={{ background: 'var(--brand)' }}
                      >
                        <Icon name="tag" size={13} />
                      </span>
                    </div>
                  ) : (
                    <span
                      className="block size-3.5 rounded-full border-2 border-white shadow"
                      style={{ background: active ? 'var(--amber)' : 'var(--ink-3)' }}
                    />
                  )}
                </MarkerContent>
                {(todayMarker || active) && (
                  <MarkerLabel
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow',
                      todayMarker ? 'bg-[var(--brand)]' : 'bg-[var(--ink)]',
                    )}
                  >
                    {m.area}
                    {todayMarker ? ` · ${m.discountPercent}% off` : ''}
                  </MarkerLabel>
                )}
                <MarkerTooltip>
                  {m.area} · {dayName(m.day)} · {m.discountPercent}% off
                </MarkerTooltip>
              </MapMarker>
            );
          })}
        </Map>
      </div>
    </div>
  );
}

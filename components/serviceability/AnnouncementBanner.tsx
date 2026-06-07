'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { dayName } from '@/lib/market';
import { useServiceability } from '@/store/serviceability';

const TONE: Record<string, string> = {
  serviceable: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  scheduled: 'bg-amber-50 text-amber-900 border-amber-200',
  unserviceable: 'bg-rose-50 text-rose-900 border-rose-200',
  unknown: 'bg-neutral-100 text-neutral-800 border-neutral-200',
};

/**
 * Landing-page delivery banner. Resolves the shopper's pincode (geolocation or
 * manual) and shows whether the weekly market reaches them today, on a later
 * day, or not at all. Informational only — it never blocks browsing or the cart.
 */
export function AnnouncementBanner() {
  const { pincode, serviceability, ready, locating, error, detect, setPincode, isOutOfRange } =
    useServiceability();
  const [input, setInput] = useState('');

  if (!ready) return null;

  const message = (() => {
    if (isOutOfRange) {
      return `🚚 We are currently working on your location. You can still browse — try another pincode.`;
    }
    switch (serviceability.state) {
      case 'serviceable':
        return `🎉 We're delivering to ${pincode} today — ${serviceability.market.area}. Enjoy ${serviceability.market.discountPercent}% off!`;
      case 'scheduled':
        return `🗓️ The weekly market reaches ${pincode} (${serviceability.market.area}) on ${dayName(serviceability.nextDay)}. Browse now — ordering opens then.`;
      case 'unserviceable':
        return `🚚 We are currently working on your location. You can still browse — try another pincode.`;
      default:
        return '📍 Check delivery in your area — share your location or enter your pincode.';
    }
  })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setPincode(input);
      setInput('');
    }
  };

  return (
    <div
      className={`mt-2 mb-1 flex flex-col gap-2.5 rounded-[var(--radius-card)] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${TONE[serviceability.state]}`}
    >
      <p className="text-sm font-semibold">{message}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={detect}
          disabled={locating}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)] disabled:opacity-60"
        >
          <Icon name="pin" size={15} />
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        <form onSubmit={submit} className="flex items-center gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder={pincode ?? 'Pincode'}
            aria-label="Pincode"
            className="h-9 w-28 rounded-lg border border-white/60 bg-white/80 px-3 text-sm text-neutral-900 outline-none focus:border-[var(--brand)]"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-black/10 bg-white/70 px-3 text-sm font-semibold"
          >
            Check
          </button>
        </form>
      </div>

      {error && <p className="w-full text-xs opacity-80 sm:w-auto">{error}</p>}
    </div>
  );
}

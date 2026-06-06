/**
 * Travelling weekly market ("haat") schedule — mock data.
 *
 * The market moves to a different place each day but is always at the same place
 * on a given weekday (e.g. it's in Indiranagar every Monday). On that day, the
 * covered pincode gets a market discount. This is the in-memory backing store
 * for `lib/queries.ts`; the admin panel will manage these stops later and the
 * query layer will read them from Firestore — callers won't change.
 *
 * Coordinates are around Bengaluru, matching the sample delivery addresses.
 */
import type { MarketDay } from './types';

/** Names for the seven weekdays, indexed 0 (Sunday) … 6 (Saturday). */
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Market stops — each open on one or more weekdays. */
export const WEEKLY_MARKET: MarketDay[] = [
  {
    days: [1, 4],
    zip: '560038',
    area: 'Indiranagar',
    lng: 77.6408,
    lat: 12.9719,
    discountPercent: 15,
  },
  {
    days: [2],
    zip: '560025',
    area: 'Residency Road',
    lng: 77.6033,
    lat: 12.9611,
    discountPercent: 12,
  },
  {
    days: [3, 6],
    zip: '560095',
    area: 'Koramangala',
    lng: 77.6245,
    lat: 12.9352,
    discountPercent: 15,
  },
  { days: [4], zip: '560078', area: 'JP Nagar', lng: 77.5853, lat: 12.9063, discountPercent: 10 },
  { days: [5], zip: '560008', area: 'Ulsoor', lng: 77.6209, lat: 12.9826, discountPercent: 12 },
  {
    days: [6],
    zip: '560043',
    area: 'Kammanahalli',
    lng: 77.6387,
    lat: 13.0149,
    discountPercent: 18,
  },
  { days: [0], zip: '560102', area: 'HSR Layout', lng: 77.6446, lat: 12.9116, discountPercent: 20 },
];

/** Map centre (Bengaluru) and default zoom for the homepage map. */
export const MARKET_MAP_CENTER: [number, number] = [77.61, 12.95];
export const MARKET_MAP_ZOOM = 11;

/** Sort key that puts Monday first, Sunday last. */
const weekIndex = (day: number): number => ((((day % 7) + 7) % 7) + 6) % 7;

/** Display name for a single weekday index. */
export const dayName = (day: number): string => DAY_NAMES[((day % 7) + 7) % 7];

/** Short comma-joined names for a set of weekdays, e.g. "Mon, Thu". */
export const dayNames = (days: number[]): string =>
  [...days]
    .sort((a, b) => weekIndex(a) - weekIndex(b))
    .map((d) => dayName(d).slice(0, 3))
    .join(', ');

/** The first market stop open on a given weekday, if any. */
export function marketForDay(day: number, schedule: MarketDay[] = WEEKLY_MARKET): MarketDay | null {
  return schedule.find((m) => m.days.includes(day)) ?? null;
}

/** The market stop(s) that ever cover a pincode (usually one). */
export function marketsForZip(zip: string, schedule: MarketDay[] = WEEKLY_MARKET): MarketDay[] {
  const z = zip.trim();
  return schedule.filter((m) => m.zip === z);
}

/** Apply a market discount to a price, rounded to the nearest rupee. */
export function applyMarketDiscount(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}

/**
 * Delivery serviceability for a pincode against the weekly market.
 * - `serviceable`: the market is in this pincode today → orders allowed.
 * - `scheduled`: the market visits this pincode on another day → not yet.
 * - `unserviceable`: no market stop ever covers this pincode.
 * - `unknown`: no pincode provided yet.
 */
export type Serviceability =
  | { state: 'unknown' }
  | { state: 'serviceable'; market: MarketDay }
  | { state: 'scheduled'; market: MarketDay; nextDay: number; daysAway: number }
  | { state: 'unserviceable' };

/** Evaluate {@link Serviceability} for a pincode on a given weekday (0–6). */
export function evaluateServiceability(
  pincode: string | null | undefined,
  schedule: MarketDay[],
  day: number,
): Serviceability {
  const zip = (pincode ?? '').trim();
  if (!zip) return { state: 'unknown' };

  const today = marketForDay(day, schedule);
  if (today && today.zip === zip) return { state: 'serviceable', market: today };

  const stop = marketsForZip(zip, schedule)[0];
  if (stop && stop.days.length) {
    // Soonest upcoming open day for this stop (treat "today" as a week away,
    // since it isn't serviceable here right now).
    const daysAway = Math.min(
      ...stop.days.map((d) => {
        const diff = (((d - day) % 7) + 7) % 7;
        return diff === 0 ? 7 : diff;
      }),
    );
    return { state: 'scheduled', market: stop, nextDay: (day + daysAway) % 7, daysAway };
  }
  return { state: 'unserviceable' };
}

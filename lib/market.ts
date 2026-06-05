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

/** One market stop per weekday. */
export const WEEKLY_MARKET: MarketDay[] = [
  { day: 1, zip: '560038', area: 'Indiranagar', lng: 77.6408, lat: 12.9719, discountPercent: 15 },
  { day: 2, zip: '560025', area: 'Residency Road', lng: 77.6033, lat: 12.9611, discountPercent: 12 },
  { day: 3, zip: '560095', area: 'Koramangala', lng: 77.6245, lat: 12.9352, discountPercent: 15 },
  { day: 4, zip: '560078', area: 'JP Nagar', lng: 77.5853, lat: 12.9063, discountPercent: 10 },
  { day: 5, zip: '560008', area: 'Ulsoor', lng: 77.6209, lat: 12.9826, discountPercent: 12 },
  { day: 6, zip: '560043', area: 'Kammanahalli', lng: 77.6387, lat: 13.0149, discountPercent: 18 },
  { day: 0, zip: '560102', area: 'HSR Layout', lng: 77.6446, lat: 12.9116, discountPercent: 20 },
];

/** Map centre (Bengaluru) and default zoom for the homepage map. */
export const MARKET_MAP_CENTER: [number, number] = [77.61, 12.95];
export const MARKET_MAP_ZOOM = 11;

/** Display name for a weekday index. */
export const dayName = (day: number): string => DAY_NAMES[((day % 7) + 7) % 7];

/** The market stop scheduled for a given weekday, if any. */
export function marketForDay(day: number, schedule: MarketDay[] = WEEKLY_MARKET): MarketDay | null {
  return schedule.find((m) => m.day === day) ?? null;
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

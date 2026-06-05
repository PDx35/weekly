/**
 * Firebase Analytics event tracking (client-only, best-effort).
 *
 * Lazily initialises Analytics behind `isSupported()` so it no-ops during SSR,
 * in unsupported browsers, or when measurement is unavailable — callers never
 * need to guard. Uses the project's existing measurementId; no new vendor.
 */
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { firebaseApp } from '@/lib/firebase/client';

let instancePromise: Promise<Analytics | null> | null = null;

function analyticsInstance(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!instancePromise) {
    instancePromise = isSupported()
      .then((ok) => (ok ? getAnalytics(firebaseApp) : null))
      .catch(() => null);
  }
  return instancePromise;
}

/** Fire an analytics event (best-effort; silently no-ops if unavailable). */
export async function track(event: string, params?: Record<string, unknown>): Promise<void> {
  const analytics = await analyticsInstance();
  if (analytics) logEvent(analytics, event, params);
}

export const trackAddToCart = (params?: Record<string, unknown>) => track('add_to_cart', params);
export const trackBeginCheckout = (params?: Record<string, unknown>) =>
  track('begin_checkout', params);
export const trackPurchase = (params?: Record<string, unknown>) => track('purchase', params);

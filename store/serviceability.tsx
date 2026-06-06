'use client';

/**
 * Serviceability context.
 *
 * Resolves the shopper's pincode (geolocation → reverse-geocode, or manual /
 * remembered) and evaluates it against the weekly market schedule: orders are
 * only allowed when the market is in the shopper's pincode *today*. Drives the
 * landing announcement banner and the checkout gate. Does NOT touch the cart —
 * browsing and adding to cart stay open to everyone.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { evaluateServiceability, type Serviceability } from '@/lib/market';
import type { MarketDay } from '@/lib/types';

const LS_KEY = 'freshmart_pincode_v1';

interface ServiceabilityContextValue {
  /** Resolved delivery pincode, or `null` if unknown. */
  pincode: string | null;
  /** Weekly market schedule (from the API). */
  schedule: MarketDay[];
  /** Geolocation lookup in progress. */
  locating: boolean;
  /** Last error message (geolocation / geocode), or `null`. */
  error: string | null;
  /** Schedule + initial pincode have loaded (avoids flashing "unserviceable"). */
  ready: boolean;
  /** Serviceability for the current `pincode`. */
  serviceability: Serviceability;
  /** Detect the pincode via the browser's geolocation. */
  detect: () => void;
  /** Set the pincode manually (digits only). */
  setPincode: (zip: string) => void;
  /** Forget the saved pincode. */
  clearPincode: () => void;
  /** Evaluate an arbitrary pincode (e.g. a checkout address) against today. */
  evaluate: (zip: string) => Serviceability;
}

const ServiceabilityContext = createContext<ServiceabilityContextValue | null>(null);

function persist(zip: string | null) {
  try {
    if (zip) localStorage.setItem(LS_KEY, zip);
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export function ServiceabilityProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincodeState] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<MarketDay[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [day, setDay] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-only init: today's weekday, remembered pincode, market schedule.
  // setState runs here (not in render) so server/client first paint match.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDay(new Date().getDay());
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setPincodeState(saved);
    } catch {
      /* ignore */
    }
    fetch('/api/market')
      .then((r) => (r.ok ? r.json() : []))
      .then((s: MarketDay[]) => setSchedule(Array.isArray(s) ? s : []))
      .catch(() => setSchedule([]))
      .finally(() => setScheduleLoaded(true));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setPincode = useCallback((zip: string) => {
    const z = zip.replace(/\D/g, '').slice(0, 6);
    setPincodeState(z || null);
    persist(z || null);
    setError(null);
  }, []);

  const clearPincode = useCallback(() => {
    setPincodeState(null);
    persist(null);
  }, []);

  const detect = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not available on this device.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          const data = (await res.json()) as { postcode?: string };
          const zip = String(data.postcode ?? '')
            .replace(/\D/g, '')
            .slice(0, 6);
          if (zip) {
            setPincodeState(zip);
            persist(zip);
          } else {
            setError('Could not detect your pincode — enter it manually.');
          }
        } catch {
          setError('Could not detect your location — enter your pincode.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError('Location permission denied — enter your pincode.');
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  }, []);

  const evaluate = useCallback(
    (zip: string): Serviceability =>
      evaluateServiceability(zip, schedule, day ?? new Date().getDay()),
    [schedule, day],
  );

  const serviceability = useMemo<Serviceability>(
    () => (day == null ? { state: 'unknown' } : evaluateServiceability(pincode, schedule, day)),
    [pincode, schedule, day],
  );

  const value = useMemo<ServiceabilityContextValue>(
    () => ({
      pincode,
      schedule,
      locating,
      error,
      ready: scheduleLoaded && day != null,
      serviceability,
      detect,
      setPincode,
      clearPincode,
      evaluate,
    }),
    [
      pincode,
      schedule,
      locating,
      error,
      scheduleLoaded,
      day,
      serviceability,
      detect,
      setPincode,
      clearPincode,
      evaluate,
    ],
  );

  return <ServiceabilityContext.Provider value={value}>{children}</ServiceabilityContext.Provider>;
}

/** Access serviceability state. Throws outside {@link ServiceabilityProvider}. */
export function useServiceability(): ServiceabilityContextValue {
  const ctx = useContext(ServiceabilityContext);
  if (!ctx) throw new Error('useServiceability must be used within a ServiceabilityProvider');
  return ctx;
}

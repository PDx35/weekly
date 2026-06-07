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
  useRef,
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
  /** Coordinates of the user's detected location. */
  coords: { lat: number; lng: number } | null;
  /** Resolved city or locality name, or `null` if unknown. */
  locationName: string | null;
  /** Whether the user's coordinates are further than 20km from all markets. */
  isOutOfRange: boolean;
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

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ServiceabilityProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincodeState] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<MarketDay[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [day, setDay] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Client-only init: today's weekday, remembered pincode, market schedule.
  // setState runs here (not in render) so server/client first paint match.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDay(new Date().getDay());
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setPincodeState(saved);
      const savedCoords = localStorage.getItem('freshmart_coords_v1');
      if (savedCoords) {
        setCoords(JSON.parse(savedCoords));
      }
      const savedLoc = localStorage.getItem('freshmart_loc_name_v1');
      if (savedLoc) setLocationName(savedLoc);
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

    // Look up area name from schedule
    const stop = schedule.find((s) => s.zip === z);
    if (stop) {
      setLocationName(stop.area);
      try {
        localStorage.setItem('freshmart_loc_name_v1', stop.area);
      } catch {}
    } else {
      setLocationName(null);
      try {
        localStorage.removeItem('freshmart_loc_name_v1');
      } catch {}
    }
  }, [schedule]);

  const clearPincode = useCallback(() => {
    setPincodeState(null);
    setCoords(null);
    setLocationName(null);
    persist(null);
    try {
      localStorage.removeItem('freshmart_coords_v1');
      localStorage.removeItem('freshmart_loc_name_v1');
    } catch {}
  }, []);

  const locatingRef = useRef(false);

  const detect = useCallback(() => {
    if (locatingRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not available on this device.');
      return;
    }

    interface LocalityInfoItem {
      name: string;
      description?: string;
    }
    interface BigDataCloudResponse {
      postcode?: string;
      locality?: string;
      city?: string;
      localityInfo?: {
        administrative?: LocalityInfoItem[];
      };
    }

    // IP-based geocoding fallback (no lat/lng passed to BigDataCloud reverse geocode)
    const fallbackToIp = async () => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en`,
        );
        if (res.ok) {
          const data = (await res.json()) as BigDataCloudResponse;
          let zip = String(data.postcode ?? '')
            .replace(/\D/g, '')
            .slice(0, 6);

          if (!zip && data.localityInfo?.administrative) {
            const postalItem = data.localityInfo.administrative.find(
              (item) =>
                item.description?.toLowerCase() === 'postal code' ||
                /^\d{6}$/.test(item.name.trim())
            );
            if (postalItem) {
              zip = postalItem.name.replace(/\D/g, '').slice(0, 6);
            }
          }

          if (zip) {
            setPincodeState(zip);
            persist(zip);
            const locName = data.locality || data.city || '';
            if (locName) {
              setLocationName(locName);
              try {
                localStorage.setItem('freshmart_loc_name_v1', locName);
              } catch {}
            }
            setError(null);
            return true;
          }
        }
      } catch (e) {
        console.error('IP location fallback failed:', e);
      }
      return false;
    };

    locatingRef.current = true;
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          try {
            localStorage.setItem('freshmart_coords_v1', JSON.stringify({ lat: latitude, lng: longitude }));
          } catch {}

          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );

          const data = (await res.json()) as BigDataCloudResponse;
          let zip = String(data.postcode ?? '')
            .replace(/\D/g, '')
            .slice(0, 6);
          let locName = data.locality || data.city || '';

          // Fallback 1: Scan administrative records for postal code descriptions or 6-digit names
          if (!zip && data.localityInfo?.administrative) {
            const postalItem = data.localityInfo.administrative.find(
              (item) =>
                item.description?.toLowerCase() === 'postal code' ||
                /^\d{6}$/.test(item.name.trim())
            );
            if (postalItem) {
              zip = postalItem.name.replace(/\D/g, '').slice(0, 6);
            }
          }

          // Fallback 2: Query OpenStreetMap Nominatim reverse geocoding
          if (!zip) {
            try {
              const osmRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
              );
              if (osmRes.ok) {
                const osmData = (await osmRes.json()) as {
                  address?: { postcode?: string; suburb?: string; city?: string; town?: string; village?: string };
                };
                zip = String(osmData.address?.postcode ?? '')
                  .replace(/\D/g, '')
                  .slice(0, 6);
                if (!locName) {
                  locName = osmData.address?.suburb || osmData.address?.city || osmData.address?.town || osmData.address?.village || '';
                }
              }
            } catch (err) {
              console.error('OSM Nominatim fallback failed:', err);
            }
          }

          if (zip) {
            setPincodeState(zip);
            persist(zip);
            if (locName) {
              setLocationName(locName);
              try {
                localStorage.setItem('freshmart_loc_name_v1', locName);
              } catch {}
            }
            setError(null);
            locatingRef.current = false; // Mark resolved immediately to preempt error timeout
          } else {
            const success = await fallbackToIp();
            if (success) {
              locatingRef.current = false;
            } else {
              setError('Could not detect your pincode — enter it manually.');
            }
          }
        } catch {
          const success = await fallbackToIp();
          if (success) {
            locatingRef.current = false;
          } else {
            setError('Could not detect your location — enter your pincode.');
          }
          setLocating(false);
          locatingRef.current = false;
        }
      },
      async (err) => {
        // Attempt IP fallback first regardless of browser error
        const success = await fallbackToIp();
        if (success) {
          setLocating(false);
          locatingRef.current = false;
          return;
        }

        // Delay setting the error to let success geocoding finish if it runs concurrently (e.g. WebKit bug)
        setTimeout(() => {
          if (!locatingRef.current) return;

          if (err.code === 1) {
            setError('Location permission denied — enter your pincode.');
          } else if (err.code === 2) {
            setError('Location unavailable — enter your pincode.');
          } else if (err.code === 3) {
            setError('Location detection timed out — enter your pincode.');
          } else {
            setError('Could not detect your location — enter your pincode.');
          }
          setLocating(false);
          locatingRef.current = false;
        }, 1000);
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

  const distanceToMarket = useMemo(() => {
    if (!coords || !schedule || schedule.length === 0) return null;
    let minD = Infinity;
    for (const stop of schedule) {
      if (stop.lat != null && stop.lng != null) {
        const d = getDistanceKm(coords.lat, coords.lng, stop.lat, stop.lng);
        if (d < minD) minD = d;
      }
    }
    return minD === Infinity ? null : minD;
  }, [coords, schedule]);

  const isOutOfRange = useMemo(() => {
    if (!coords || distanceToMarket == null) return false;
    return distanceToMarket > 20;
  }, [coords, distanceToMarket]);

  const value = useMemo<ServiceabilityContextValue>(
    () => ({
      pincode,
      schedule,
      locating,
      error,
      ready: scheduleLoaded && day != null,
      serviceability,
      coords,
      locationName,
      isOutOfRange,
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
      coords,
      locationName,
      isOutOfRange,
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

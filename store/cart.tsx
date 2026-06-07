'use client';

/**
 * Cart context (Sprint 3).
 *
 * Cart is keyed by product id → quantity. It persists to localStorage for
 * guests and syncs to a `cart` field on `users/{uid}` once signed in: on
 * sign-in the local (guest) cart is merged into the remote cart (local wins on
 * conflicts), and subsequent changes are written through to Firestore. Also
 * owns the global `Toast`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { trackAddToCart } from '@/lib/analytics';
import { PRODUCTS as MOCK_PRODUCTS } from '@/lib/data';
import { db } from '@/lib/firebase/client';
import { routes } from '@/lib/routes';
import type { CartItem, Product } from '@/lib/types';
import { useAuth } from './auth';

type CartMap = Record<string, number>;

const LS_KEY = 'freshmart_cart_v1';

function loadLS(): CartMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}') as CartMap;
  } catch {
    return {};
  }
}

function saveLS(cart: CartMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

interface CartContextValue {
  /** Map of product id → quantity. */
  cart: CartMap;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  /** Cart lines hydrated with product data (skips unknown ids). */
  cartItems: CartItem[];
  /** Total number of units in the cart. */
  cartCount: number;
  /** Sum of price × qty across the cart. */
  cartSubtotal: number;
  /** Current toast message, or `null` when hidden. */
  toast: ReactNode | null;
  /** Show a transient toast message. */
  showToast: (msg: ReactNode) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartMap>({});
  const [toast, setToast] = useState<ReactNode | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);

  const hydrated = useRef(false);
  const cartRef = useRef<CartMap>(cart);
  // The uid whose remote cart we've already merged (gates write-through).
  const mergedUid = useRef<string | null>(null);

  // Fetch all live products on mount for client-side catalog matching.
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (data && data.length) {
          setProducts(data);
        }
      })
      .catch(() => {
        /* fallback to MOCK_PRODUCTS is handled in cartItems lookup */
      });
  }, []);

  // Keep a ref to the latest cart for the sign-in merge (read in an effect).
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Hydrate from localStorage once on mount. Done in an effect (not a lazy
  // initial state) so server and client first-render match — avoiding a
  // hydration mismatch on the cart badge.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe localStorage hydration
    setCart(loadLS());
    hydrated.current = true;
  }, []);

  // Persist to localStorage on every change (after hydration).
  useEffect(() => {
    if (hydrated.current) saveLS(cart);
  }, [cart]);

  // On sign-in: merge the local cart into the remote cart (local wins), then
  // write back. On sign-out: reset the merge gate.
  useEffect(() => {
    if (!user) {
      mergedUid.current = null;
      return;
    }
    if (mergedUid.current === user.uid) return;
    let cancelled = false;
    (async () => {
      const ref = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(ref);
        const remote = (snap.data()?.cart as CartMap) ?? {};
        const local = cartRef.current;
        const merged = Object.keys(local).length ? { ...remote, ...local } : remote;
        if (cancelled) return;
        mergedUid.current = user.uid;
        setCart(merged);
        await setDoc(ref, { cart: merged }, { merge: true });
      } catch {
        // Firestore unavailable/denied — keep the local cart.
        if (!cancelled) mergedUid.current = user.uid;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Write cart changes through to Firestore while signed in (after merge).
  useEffect(() => {
    if (!user || mergedUid.current !== user.uid) return;
    setDoc(doc(db, 'users', user.uid), { cart }, { merge: true }).catch(() => {
      /* ignore offline / rules errors */
    });
  }, [cart, user]);

  const showLoginToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Please login to add items to cart.
        <Link href={routes.auth()} className="toast-btn" onClick={() => setToast(null)}>
          Login
        </Link>
      </span>
    );
    // Give more time (4 seconds) for the user to read and click the login button
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    if (qty > 0) void trackAddToCart({ item_id: id, quantity: qty });
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + qty) }));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    // Count a 0 → positive transition as an add-to-cart.
    if (qty > 0 && !cartRef.current[id]) void trackAddToCart({ item_id: id, quantity: qty });
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const showToast = useCallback((msg: ReactNode) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const cartItems = useMemo<CartItem[]>(
    () => {
      const list = products.length ? products : MOCK_PRODUCTS;
      return Object.entries(cart)
        .map(([id, qty]) => ({ product: list.find((p) => p.id === id), qty }))
        .filter((x): x is CartItem => Boolean(x.product));
    },
    [cart, products],
  );
  const cartCount = useMemo(() => cartItems.reduce((s, x) => s + x.qty, 0), [cartItems]);
  const cartSubtotal = useMemo(
    () => cartItems.reduce((s, x) => s + x.product.price * x.qty, 0),
    [cartItems],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      cartItems,
      cartCount,
      cartSubtotal,
      toast,
      showToast,
    }),
    [
      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      cartItems,
      cartCount,
      cartSubtotal,
      toast,
      showToast,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Access the cart context. Throws if used outside {@link CartProvider}. */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

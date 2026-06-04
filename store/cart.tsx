'use client';

/**
 * Cart context shell (Sprint 0).
 *
 * In-memory cart keyed by product id → quantity, mirroring the prototype
 * `store.jsx`. Sprint 3 adds localStorage persistence for guests and Firestore
 * sync on sign-in; for now this is enough to drive the chrome (cart badge),
 * `ProductCard`, and the `Toast`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { find } from '@/lib/data';
import type { CartItem } from '@/lib/types';

interface CartContextValue {
  /** Map of product id → quantity. */
  cart: Record<string, number>;
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
  toast: string | null;
  /** Show a transient toast message. */
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const addToCart = useCallback((id: string, qty = 1) => {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + qty) }));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
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

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const cartItems = useMemo<CartItem[]>(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: find(id), qty }))
        .filter((x): x is CartItem => Boolean(x.product)),
    [cart],
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

/* FreshMart — global store via React context. Exports StoreProvider + useStore. */

const AppCtx = React.createContext(null);
const useStore = () => React.useContext(AppCtx);

const LS_KEY = 'freshmart_v1';
const loadLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};

function StoreProvider({ children }) {
  const D = window.FM_DATA;
  const persisted = loadLS();

  // ── Auth ──
  const [user, setUser] = React.useState(persisted.user || null);

  // ── Routing (state-based, with history stack) ──
  const [route, setRoute] = React.useState(
    persisted.user ? { name: 'home', params: {} } : { name: 'auth', params: {} }
  );
  const histRef = React.useRef([]);

  const nav = React.useCallback((name, params = {}) => {
    setRoute((prev) => {
      histRef.current.push(prev);
      return { name, params };
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const back = React.useCallback(() => {
    const prev = histRef.current.pop();
    if (prev) setRoute(prev);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Cart: { [productId]: qty } ──
  const [cart, setCart] = React.useState(persisted.cart || {});
  const addToCart = (id, qty = 1) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + qty) }));
  const setQty = (id, qty) =>
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id]; else n[id] = qty;
      return n;
    });
  const removeFromCart = (id) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });
  const clearCart = () => setCart({});

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: D.find(id), qty }))
    .filter((x) => x.product);
  const cartCount = cartItems.reduce((s, x) => s + x.qty, 0);
  const cartSubtotal = cartItems.reduce((s, x) => s + x.product.price * x.qty, 0);

  // ── Addresses ──
  const [addresses, setAddresses] = React.useState(persisted.addresses || D.sampleAddresses);
  const [selectedAddr, setSelectedAddr] = React.useState(
    persisted.selectedAddr || (D.sampleAddresses.find((a) => a.def) || {}).id || null
  );
  const upsertAddress = (addr) => {
    setAddresses((list) => {
      if (addr.id && list.some((a) => a.id === addr.id)) {
        return list.map((a) => (a.id === addr.id ? { ...a, ...addr } : a));
      }
      const id = addr.id || 'a' + Date.now();
      return [...list, { ...addr, id }];
    });
    if (addr.id) return addr.id;
    return null;
  };
  const deleteAddress = (id) => setAddresses((l) => l.filter((a) => a.id !== id));

  // ── Orders ──
  const [orders, setOrders] = React.useState(persisted.orders || seedOrders(D));

  const placeOrder = ({ items, address, payment, totals }) => {
    const id = 'FM' + String(100237 + orders.length).padStart(6, '0');
    const order = {
      id,
      placedAt: Date.now(),
      items: items.map((x) => ({ id: x.product.id, name: x.product.name, unit: x.product.unit, price: x.product.price, qty: x.qty })),
      address, payment, totals,
      status: 'confirmed',
      eta: 32, // minutes
    };
    setOrders((o) => [order, ...o]);
    return order;
  };

  // ── Persist ──
  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, cart, addresses, selectedAddr, orders }));
  }, [user, cart, addresses, selectedAddr, orders]);

  // ── Toast ──
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef();
  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const value = {
    D,
    user, setUser,
    route, nav, back, canBack: () => histRef.current.length > 0,
    cart, addToCart, setQty, removeFromCart, clearCart,
    cartItems, cartCount, cartSubtotal,
    addresses, selectedAddr, setSelectedAddr, upsertAddress, deleteAddress,
    orders, placeOrder,
    toast, showToast,
  };

  return React.createElement(AppCtx.Provider, { value }, children);
}

// One past delivered order so Order History isn't empty for new visitors
function seedOrders(D) {
  const pick = (id, qty) => { const p = D.find(id); return { id, name: p.name, unit: p.unit, price: p.price, qty }; };
  const items = [pick('p15', 2), pick('p8', 1), pick('p30', 1), pick('p18', 1)];
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return [{
    id: 'FM100236',
    placedAt: Date.now() - 1000 * 60 * 60 * 26,
    items,
    address: D.sampleAddresses[0],
    payment: { method: 'upi', label: 'UPI · aarav@okhdfc' },
    totals: { items: itemsTotal, delivery: 0, handling: 9, discount: 40, grand: itemsTotal + 9 - 40 },
    status: 'delivered',
    eta: 0,
  }];
}

Object.assign(window, { AppCtx, useStore, StoreProvider });

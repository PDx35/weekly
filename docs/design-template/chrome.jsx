/* FreshMart — app chrome: header, search, mobile bottom-nav, footer. */

function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="FreshMart home">
      <span className="logo-mark"><Icon name="leaf" size={19} stroke={1.9} /></span>
      <span className="logo-text">fresh<b>mart</b></span>
    </button>
  );
}

// Search box with live suggestions
function SearchBox({ compact }) {
  const s = useStore();
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const results = q.trim().length > 0
    ? s.D.PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        s.D.catName(p.cat).toLowerCase().includes(q.toLowerCase())
      ).slice(0, 6)
    : [];

  React.useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = () => {
    if (!q.trim()) return;
    s.nav('search', { q });
    setOpen(false);
  };

  return (
    <div className={`search ${compact ? 'search-compact' : ''}`} ref={wrapRef}>
      <Icon name="search" size={18} className="search-ico" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder='Search "milk", "mango", "atta"…'
      />
      {q && <button className="search-clear" onClick={() => setQ('')}><Icon name="x" size={15} /></button>}
      {open && results.length > 0 && (
        <div className="search-pop">
          {results.map((p) => (
            <button key={p.id} className="search-item" onClick={() => { s.nav('product', { id: p.id }); setOpen(false); }}>
              <Img product={p} className="search-thumb" radius="8px" />
              <span className="search-meta">
                <b>{p.name}</b>
                <span>{s.D.catName(p.cat)} · {p.unit}</span>
              </span>
              <Price value={p.price} size="sm" />
            </button>
          ))}
          <button className="search-all" onClick={submit}>See all results for “{q}” <Icon name="arrowR" size={15} /></button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const s = useStore();
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <Logo onClick={() => s.nav('home')} />

        <button className="hdr-loc" onClick={() => s.nav('addresses')}>
          <Icon name="pin" size={17} />
          <span>
            <i>Deliver in 30 min to</i>
            <b>{(s.addresses.find((a) => a.id === s.selectedAddr) || s.addresses[0] || {}).label || 'Set location'} <Icon name="chevD" size={13} /></b>
          </span>
        </button>

        <div className="hdr-search"><SearchBox /></div>

        <nav className="hdr-nav">
          <button className="hdr-link" onClick={() => s.nav('orders')}>
            <Icon name="receipt" size={20} /><span>Orders</span>
          </button>
          <button className="hdr-link" onClick={() => (s.user ? s.nav('account') : s.nav('auth'))}>
            <Icon name="user" size={20} /><span>{s.user ? s.user.name.split(' ')[0] : 'Login'}</span>
          </button>
          <button className="hdr-cart" onClick={() => s.nav('cart')}>
            <Icon name="cart" size={20} />
            <span>Cart</span>
            {s.cartCount > 0 && <i className="cart-badge">{s.cartCount}</i>}
          </button>
        </nav>
      </div>

      {/* Category strip (desktop) */}
      <div className="catbar">
        <div className="catbar-inner">
          <button className="catbar-all" onClick={() => s.nav('browse')}>
            <Icon name="grid" size={16} /> All categories
          </button>
          {s.D.CATEGORIES.map((c) => (
            <button key={c.id} className="catbar-item" onClick={() => s.nav('category', { id: c.id })}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// Mobile sub-header (logo + search) shown under top app bar
function MobileTop() {
  const s = useStore();
  return (
    <div className="mtop">
      <div className="mtop-bar">
        <button className="mtop-loc" onClick={() => s.nav('addresses')}>
          <Icon name="pin" size={16} />
          <b>{(s.addresses.find((a) => a.id === s.selectedAddr) || s.addresses[0] || {}).label || 'Location'}</b>
          <Icon name="chevD" size={13} />
        </button>
        <button className="mtop-user" onClick={() => (s.user ? s.nav('account') : s.nav('auth'))}>
          <Icon name="user" size={20} />
        </button>
      </div>
      <div className="mtop-search"><SearchBox /></div>
    </div>
  );
}

function MobileNav() {
  const s = useStore();
  const r = s.route.name;
  const items = [
    { name: 'home', icon: 'home', label: 'Home' },
    { name: 'browse', icon: 'grid', label: 'Categories' },
    { name: 'orders', icon: 'receipt', label: 'Orders' },
    { name: s.user ? 'account' : 'auth', icon: 'user', label: 'Account' },
  ];
  return (
    <nav className="mnav">
      {items.map((it) => (
        <button key={it.label} className={`mnav-i ${r === it.name ? 'on' : ''}`} onClick={() => s.nav(it.name)}>
          <Icon name={it.icon} size={22} />
          <span>{it.label}</span>
        </button>
      ))}
      <button className={`mnav-i mnav-cart ${r === 'cart' ? 'on' : ''}`} onClick={() => s.nav('cart')}>
        <div className="mnav-cart-ico">
          <Icon name="cart" size={22} />
          {s.cartCount > 0 && <i>{s.cartCount}</i>}
        </div>
        <span>Cart</span>
      </button>
    </nav>
  );
}

function Footer() {
  const s = useStore();
  const cols = [
    { h: 'Shop', links: ['Fresh Fruits', 'Vegetables', 'Dairy & Eggs', 'Bakery', 'Staples & Grains'] },
    { h: 'Company', links: ['About FreshMart', 'Careers', 'FreshMart for Business', 'Press', 'Blog'] },
    { h: 'Support', links: ['Help Centre', 'Track your order', 'Returns & refunds', 'Contact us', 'Report an issue'] },
  ];
  return (
    <footer className="ftr">
      <div className="ftr-inner">
        <div className="ftr-brand">
          <Logo onClick={() => s.nav('home')} />
          <p>Farm-fresh groceries delivered to your door in 30 minutes. Handpicked quality, honest prices.</p>
          <div className="ftr-badges">
            <span><Icon name="truck" size={15} /> 30-min delivery</span>
            <span><Icon name="shield" size={15} /> 100% quality promise</span>
          </div>
        </div>
        <div className="ftr-cols">
          {cols.map((col) => (
            <div key={col.h} className="ftr-col">
              <h4>{col.h}</h4>
              {col.links.map((l) => (
                <button key={l} onClick={() => s.nav(l === 'Contact us' || l === 'Help Centre' || l === 'Report an issue' ? 'support' : l === 'Track your order' ? 'orders' : 'browse')}>{l}</button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="ftr-bottom">
        <span>© 2026 FreshMart Retail Pvt. Ltd.</span>
        <span className="ftr-legal">
          <button>Terms</button><button>Privacy</button><button>FSSAI Lic. 100xxxxxxxx1234</button>
        </span>
      </div>
    </footer>
  );
}

Object.assign(window, { Logo, SearchBox, Header, MobileTop, MobileNav, Footer });

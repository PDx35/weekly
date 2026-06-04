/* FreshMart — Auth, Account, Orders & invoices, Addresses, Support. */

// ── Auth (login / register) ──
function AuthScreen() {
  const s = useStore();
  const [mode, setMode] = React.useState('login');
  const [show, setShow] = React.useState(false);
  const [f, setF] = React.useState({ name: '', email: '', phone: '', pass: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = mode === 'login'
    ? f.email && f.pass.length >= 4
    : f.name && f.email && f.phone && f.pass.length >= 4;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    s.setUser({ name: f.name || 'Aarav Sharma', email: f.email || 'aarav@example.com', phone: f.phone || '+91 98765 43210' });
    s.showToast(mode === 'login' ? 'Welcome back!' : 'Account created — welcome!');
    s.nav('home');
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <Logo onClick={() => {}} />
        <div className="auth-art-mid">
          <h2>Fresh groceries,<br />delivered in 30 minutes.</h2>
          <p>Join thousands of households getting farm-fresh produce at honest prices, right to their door.</p>
          <ul className="auth-points">
            <li><Icon name="truck" size={18} /> Lightning-fast 30-minute delivery</li>
            <li><Icon name="leaf" size={18} /> Handpicked & quality-checked daily</li>
            <li><Icon name="shield" size={18} /> Not fresh? Instant refund</li>
          </ul>
        </div>
        <Img label="fresh produce" ratio="16 / 7" cat={{ tint: 'rgba(255,255,255,.16)', ink: 'rgba(255,255,255,.85)' }} radius="18px" />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
            <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-sub">{mode === 'login' ? 'Log in to continue shopping.' : 'It only takes a minute to get started.'}</p>

          <form onSubmit={submit}>
            {mode === 'register' && <Field label="Full name" value={f.name} onChange={set('name')} placeholder="Aarav Sharma" wide />}
            <Field label="Email address" type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" wide />
            {mode === 'register' && <Field label="Phone number" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" wide />}
            <label className="field field-wide">
              <span>Password</span>
              <span className="field-pass">
                <input type={show ? 'text' : 'password'} value={f.pass} onChange={set('pass')} placeholder="••••••••" />
                <button type="button" onClick={() => setShow((v) => !v)}><Icon name={show ? 'eyeOff' : 'eye'} size={18} /></button>
              </span>
            </label>
            {mode === 'login' && <button type="button" className="auth-forgot">Forgot password?</button>}
            <Button size="lg" full type="submit" disabled={!valid} iconRight="arrowR">{mode === 'login' ? 'Log in' : 'Create account'}</Button>
          </form>

          <div className="auth-or"><span>or continue with</span></div>
          <div className="auth-social">
            <button onClick={submit}>Google</button>
            <button onClick={submit}>Apple</button>
            <button onClick={submit}>Phone OTP</button>
          </div>

          <button className="auth-skip" onClick={() => { s.setUser({ name: 'Aarav Sharma', email: 'aarav@example.com', phone: '+91 98765 43210' }); s.nav('home'); }}>
            Skip for now — browse as guest <Icon name="arrowR" size={15} />
          </button>
          <p className="auth-terms">By continuing you agree to FreshMart's Terms of Service & Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}

// ── Account dashboard ──
function AccountScreen() {
  const s = useStore();
  const u = s.user || { name: 'Guest', email: '', phone: '' };
  const tiles = [
    { icon: 'receipt', t: 'My orders', d: `${s.orders.length} orders`, go: () => s.nav('orders') },
    { icon: 'pin', t: 'Saved addresses', d: `${s.addresses.length} saved`, go: () => s.nav('addresses') },
    { icon: 'cart', t: 'Your cart', d: `${s.cartCount} items`, go: () => s.nav('cart') },
    { icon: 'phone', t: 'Help & support', d: 'We’re here 24×7', go: () => s.nav('support') },
  ];
  return (
    <div className="page account">
      <h1 className="page-title">My account</h1>
      <div className="acct-head">
        <div className="acct-avatar">{u.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
        <div className="acct-id"><b>{u.name}</b><span>{u.email}</span><span>{u.phone}</span></div>
        <Button variant="ghost" icon="edit">Edit profile</Button>
      </div>
      <div className="acct-tiles">
        {tiles.map((t) => (
          <button key={t.t} className="acct-tile" onClick={t.go}>
            <span className="acct-tile-ico"><Icon name={t.icon} size={22} /></span>
            <div><b>{t.t}</b><i>{t.d}</i></div>
            <Icon name="chevR" size={18} className="acct-tile-arrow" />
          </button>
        ))}
      </div>
      <button className="acct-logout" onClick={() => { s.setUser(null); s.nav('auth'); }}>Log out</button>
    </div>
  );
}

// ── Orders & invoices ──
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

function OrdersScreen() {
  const s = useStore();
  const [invoice, setInvoice] = React.useState(null);
  if (s.orders.length === 0) {
    return <div className="page"><h1 className="page-title">Your orders</h1><Empty icon="receipt" title="No orders yet" sub="Your past orders and invoices will appear here."><Button onClick={() => s.nav('browse')} iconRight="arrowR">Shop now</Button></Empty></div>;
  }
  return (
    <div className="page orders">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Orders' }]} />
      <h1 className="page-title">Your orders</h1>
      <div className="order-list">
        {s.orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-top">
              <div>
                <span className={`order-status order-${o.status}`}>
                  <Icon name={o.status === 'delivered' ? 'check' : 'truck'} size={14} />
                  {o.status === 'delivered' ? 'Delivered' : o.status === 'confirmed' ? 'Arriving soon' : o.status}
                </span>
                <b className="order-id">#{o.id}</b>
              </div>
              <span className="order-time">{timeAgo(o.placedAt)}</span>
            </div>
            <div className="order-thumbs">
              {o.items.slice(0, 5).map((it) => (
                <Img key={it.id} cat={s.D.catOf((s.D.find(it.id) || {}).cat || 'veggies')} ratio="1 / 1" radius="10px" className="order-thumb" label={it.name} />
              ))}
              {o.items.length > 5 && <span className="order-more">+{o.items.length - 5}</span>}
            </div>
            <div className="order-bottom">
              <div className="order-sum">
                <b>{rupee(o.totals.grand)}</b>
                <span>{o.items.reduce((a, b) => a + b.qty, 0)} items · {o.payment.label}</span>
              </div>
              <div className="order-btns">
                <Button variant="ghost" size="sm" icon="receipt" onClick={() => setInvoice(o)}>Invoice</Button>
                {o.status !== 'delivered'
                  ? <Button size="sm" iconRight="arrowR" onClick={() => s.nav('confirm', { id: o.id })}>Track</Button>
                  : <Button size="sm" onClick={() => { o.items.forEach((it) => s.addToCart(it.id, it.qty)); s.showToast('Items added to cart'); s.nav('cart'); }}>Reorder</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}

function InvoiceModal({ order, onClose }) {
  const s = useStore();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal invoice" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><Icon name="x" size={18} /></button>
        <div className="inv-head">
          <Logo onClick={() => {}} />
          <div className="inv-meta"><b>Tax Invoice</b><span>#{order.id}</span><span>{new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
        </div>
        <div className="inv-to">
          <div><i>Billed to</i><b>{order.address.name}</b><span>{order.address.line1}, {order.address.city} – {order.address.pin}</span></div>
          <div><i>Payment</i><b>{order.payment.label}</b><span className="free">Paid</span></div>
        </div>
        <table className="inv-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}><td>{it.name}<i>{it.unit}</i></td><td>{it.qty}</td><td>{rupee(it.price)}</td><td>{rupee(it.price * it.qty)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="inv-bill"><BillRows bill={order.totals} /></div>
        <div className="inv-foot">
          <span><Icon name="shield" size={14} /> This is a system-generated invoice · FSSAI 100xxxxxxxx1234</span>
          <Button icon="receipt" onClick={() => s.showToast('Invoice downloaded (PDF)')}>Download PDF</Button>
        </div>
      </div>
    </div>
  );
}

// ── Address management ──
function AddressesScreen() {
  const s = useStore();
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  return (
    <div className="page addresses">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Addresses' }]} />
      <div className="page-title-row">
        <h1 className="page-title">Saved addresses</h1>
        {!adding && <Button icon="plus" onClick={() => { setEditing(null); setAdding(true); }}>Add address</Button>}
      </div>
      {adding ? (
        <div className="co-block"><h2>{editing ? 'Edit address' : 'New address'}</h2>
          <AddressForm initial={editing} onCancel={() => { setAdding(false); setEditing(null); }}
            onSave={(f) => { s.upsertAddress(editing ? { ...editing, ...f } : f); s.showToast('Address saved'); setAdding(false); setEditing(null); }} />
        </div>
      ) : (
        <div className="addr-list addr-list-page">
          {s.addresses.map((a) => (
            <div className="addr-manage" key={a.id}>
              <AddressCard a={a} selected={s.selectedAddr === a.id} onSelect={() => { s.setSelectedAddr(a.id); s.showToast(`Delivering to ${a.label}`); }} onEdit={() => { setEditing(a); setAdding(true); }} />
              <button className="addr-remove" onClick={() => s.deleteAddress(a.id)}><Icon name="trash" size={15} /> Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Support ──
function SupportScreen() {
  const s = useStore();
  const [sent, setSent] = React.useState(false);
  const [f, setF] = React.useState({ topic: 'Order issue', order: '', msg: '' });
  const faqs = [
    { q: 'How fast is delivery?', a: 'Most orders arrive within 30 minutes from your nearest FreshMart store, depending on your location and time of day.' },
    { q: 'What if a product isn’t fresh?', a: 'Report it at delivery or within 24 hours from your order page. We’ll issue an instant refund — no questions asked.' },
    { q: 'Which payment methods are accepted?', a: 'UPI, credit/debit cards, wallets, net banking, and Cash on Delivery.' },
    { q: 'Can I schedule a delivery?', a: 'Yes — choose a delivery slot at checkout for orders you’d like later in the day.' },
  ];
  return (
    <div className="page support">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Support' }]} />
      <header className="support-hero">
        <h1>How can we help?</h1>
        <p>We’re here around the clock. Browse common questions or send us a message.</p>
        <div className="support-quick">
          <a className="support-chan"><Icon name="phone" size={18} /><div><b>Call us</b><i>1800-200-FRESH</i></div></a>
          <a className="support-chan"><Icon name="mail" size={18} /><div><b>Email</b><i>care@freshmart.in</i></div></a>
          <a className="support-chan"><Icon name="info" size={18} /><div><b>Live chat</b><i>Avg. reply 2 min</i></div></a>
        </div>
      </header>

      <div className="support-grid">
        <div className="support-faq">
          <h2>Frequently asked</h2>
          {faqs.map((it, i) => (
            <details key={i} className="faq"><summary>{it.q}<Icon name="chevD" size={16} /></summary><p>{it.a}</p></details>
          ))}
        </div>

        <div className="support-form-card">
          <h2>Submit a request</h2>
          {sent ? (
            <div className="support-done">
              <div className="confirm-check small"><Icon name="check" size={26} stroke={2.4} /></div>
              <b>Request submitted</b>
              <p>Ticket <b>#SR{Math.floor(10000 + Math.random() * 89999)}</b> created. We’ll reply within 4 hours.</p>
              <Button variant="ghost" onClick={() => { setSent(false); setF({ topic: 'Order issue', order: '', msg: '' }); }}>Submit another</Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (f.msg.trim()) setSent(true); }}>
              <label className="field field-wide"><span>Topic</span>
                <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
                  <option>Order issue</option><option>Refund & returns</option><option>Payment problem</option><option>Delivery delay</option><option>Account help</option><option>Other</option>
                </select>
              </label>
              <Field label="Order ID (optional)" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} placeholder="#FM100236" wide />
              <label className="field field-wide"><span>Message</span>
                <textarea rows={5} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} placeholder="Tell us what happened…" />
              </label>
              <Button size="lg" full type="submit" disabled={!f.msg.trim()} iconRight="arrowR">Submit request</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen, AccountScreen, OrdersScreen, AddressesScreen, SupportScreen, InvoiceModal, timeAgo });

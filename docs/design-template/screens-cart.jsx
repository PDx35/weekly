/* FreshMart — Cart, Checkout (address + payment + COD), Order confirmation & tracking. */

// ── Bill math (shared) ──
function computeBill(subtotal, discount = 0) {
  const delivery = subtotal >= 199 || subtotal === 0 ? 0 : 25;
  const handling = subtotal === 0 ? 0 : 9;
  const grand = Math.max(0, subtotal + delivery + handling - discount);
  return { items: subtotal, delivery, handling, discount, grand };
}

function BillRows({ bill, freeNote }) {
  return (
    <div className="bill">
      <div className="bill-row"><span>Item total</span><b>{rupee(bill.items)}</b></div>
      <div className="bill-row">
        <span>Delivery fee</span>
        {bill.delivery === 0 ? <b className="free">FREE</b> : <b>{rupee(bill.delivery)}</b>}
      </div>
      <div className="bill-row"><span>Handling charge</span><b>{rupee(bill.handling)}</b></div>
      {bill.discount > 0 && <div className="bill-row"><span>Discount</span><b className="free">– {rupee(bill.discount)}</b></div>}
      <div className="bill-row bill-total"><span>To pay</span><b>{rupee(bill.grand)}</b></div>
      {freeNote && bill.delivery > 0 && (
        <p className="bill-note"><Icon name="truck" size={14} /> Add {rupee(199 - bill.items)} more for FREE delivery</p>
      )}
    </div>
  );
}

// ── Cart ──
function CartScreen() {
  const s = useStore();
  const [promo, setPromo] = React.useState('');
  const [applied, setApplied] = React.useState(0);
  const bill = computeBill(s.cartSubtotal, applied);

  if (s.cartItems.length === 0) {
    return (
      <div className="page cart">
        <h1 className="page-title">Your cart</h1>
        <Empty icon="cart" title="Your cart is empty" sub="Add some fresh picks and they'll show up here.">
          <Button onClick={() => s.nav('browse')} iconRight="arrowR">Start shopping</Button>
        </Empty>
      </div>
    );
  }

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (code === 'FRESH40') { setApplied(40); s.showToast('Coupon FRESH40 applied — ₹40 off'); }
    else if (code === 'FIRST50') { setApplied(50); s.showToast('Coupon FIRST50 applied — ₹50 off'); }
    else { s.showToast('Invalid coupon code'); setApplied(0); }
  };

  return (
    <div className="page cart">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Cart' }]} />
      <h1 className="page-title">Your cart <span className="muted">· {s.cartCount} items</span></h1>

      <div className="checkout-grid">
        <div className="checkout-main">
          <div className="cart-savings"><Icon name="bolt" size={16} /> Delivery in 30 minutes to <b>{(s.addresses.find((a) => a.id === s.selectedAddr) || s.addresses[0]).label}</b></div>
          <div className="cart-list">
            {s.cartItems.map(({ product, qty }) => (
              <div className="cart-row" key={product.id}>
                <button className="cart-thumb" onClick={() => s.nav('product', { id: product.id })}>
                  <Img product={product} ratio="1 / 1" radius="12px" />
                </button>
                <div className="cart-meta">
                  <button className="cart-name" onClick={() => s.nav('product', { id: product.id })}>{product.name}</button>
                  <span className="cart-unit">{product.unit}</span>
                  <Price value={product.price} mrp={product.mrp} size="sm" />
                </div>
                <div className="cart-actions">
                  <QtyStepper qty={qty} size="sm" onChange={(q) => s.setQty(product.id, q)} />
                  <button className="cart-del" onClick={() => s.removeFromCart(product.id)}><Icon name="trash" size={16} /></button>
                </div>
                <div className="cart-line">{rupee(product.price * qty)}</div>
              </div>
            ))}
          </div>

          <div className="promo-box">
            <Icon name="tag" size={18} />
            <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Coupon code (try FRESH40)" />
            <button onClick={applyPromo}>Apply</button>
          </div>
        </div>

        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Bill details</h3>
            <BillRows bill={bill} freeNote />
            <Button size="lg" full iconRight="arrowR" onClick={() => s.nav('checkout')}>Proceed to checkout</Button>
            <p className="safe-note"><Icon name="shield" size={14} /> Safe & secure payments</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Checkout (stepper) ──
const STEPS = ['Address', 'Payment', 'Review'];

function AddressCard({ a, selected, onSelect, onEdit }) {
  return (
    <button className={`addr-card ${selected ? 'on' : ''}`} onClick={onSelect}>
      <span className="addr-radio">{selected && <Icon name="check" size={14} />}</span>
      <div className="addr-body">
        <div className="addr-top"><b>{a.label}</b><span className="addr-type">{a.type}</span>{a.def && <span className="addr-def">Default</span>}</div>
        <p>{a.name} · {a.phone}</p>
        <p>{a.line1}, {a.line2}, {a.city} – {a.pin}</p>
      </div>
      <span className="addr-edit" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}><Icon name="edit" size={16} /></span>
    </button>
  );
}

function AddressForm({ initial, onSave, onCancel }) {
  const [f, setF] = React.useState(initial || { label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', pin: '', type: 'home' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.name && f.phone && f.line1 && f.city && f.pin;
  return (
    <div className="addr-form">
      <div className="addr-types">
        {['home', 'work', 'other'].map((t) => (
          <button key={t} className={`chip ${f.type === t ? 'chip-on' : ''}`} onClick={() => setF({ ...f, type: t, label: t[0].toUpperCase() + t.slice(1) })}>
            <Icon name={t === 'work' ? 'pkg' : t === 'home' ? 'home' : 'pin'} size={14} /> {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="field-grid">
        <Field label="Full name" value={f.name} onChange={set('name')} />
        <Field label="Phone number" value={f.phone} onChange={set('phone')} placeholder="+91" />
        <Field label="Flat / House no. & building" value={f.line1} onChange={set('line1')} wide />
        <Field label="Area / Street / Landmark" value={f.line2} onChange={set('line2')} wide />
        <Field label="City" value={f.city} onChange={set('city')} />
        <Field label="PIN code" value={f.pin} onChange={set('pin')} />
      </div>
      <div className="addr-form-actions">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button disabled={!valid} onClick={() => onSave(f)}>Save address</Button>
      </div>
    </div>
  );
}

function Field({ label, wide, hint, ...rest }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span>{label}</span>
      <input {...rest} />
      {hint && <i className="field-hint">{hint}</i>}
    </label>
  );
}

const PAYMENTS = [
  { id: 'upi', icon: 'bolt', label: 'UPI', sub: 'GPay, PhonePe, Paytm & more' },
  { id: 'card', icon: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'wallet', icon: 'wallet', label: 'Wallets', sub: 'Paytm, Amazon Pay, Mobikwik' },
  { id: 'netbank', icon: 'bank', label: 'Net Banking', sub: 'All major banks' },
  { id: 'cod', icon: 'cash', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
];

function PaymentForms({ method }) {
  if (method === 'upi') {
    return (
      <div className="pay-detail">
        <div className="pay-apps">
          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((a) => <button key={a} className="pay-app">{a}</button>)}
        </div>
        <Field label="Or enter UPI ID" placeholder="yourname@okhdfc" />
      </div>
    );
  }
  if (method === 'card') {
    return (
      <div className="pay-detail field-grid">
        <Field label="Card number" placeholder="1234 5678 9012 3456" wide />
        <Field label="Expiry" placeholder="MM/YY" />
        <Field label="CVV" placeholder="•••" />
        <Field label="Name on card" wide />
      </div>
    );
  }
  if (method === 'wallet') {
    return (
      <div className="pay-detail pay-apps">
        {['Paytm', 'Amazon Pay', 'Mobikwik', 'Freecharge'].map((a) => <button key={a} className="pay-app">{a}</button>)}
      </div>
    );
  }
  if (method === 'netbank') {
    return (
      <div className="pay-detail">
        <div className="pay-apps">
          {['HDFC', 'ICICI', 'SBI', 'Axis'].map((a) => <button key={a} className="pay-app">{a}</button>)}
        </div>
        <label className="field"><span>Other banks</span>
          <select><option>Choose your bank</option><option>Kotak Mahindra</option><option>Bank of Baroda</option><option>Punjab National Bank</option></select>
        </label>
      </div>
    );
  }
  return (
    <div className="pay-detail pay-cod">
      <Icon name="cash" size={20} /> Pay in cash or via UPI when your order arrives. Please keep exact change handy.
    </div>
  );
}

function CheckoutScreen() {
  const s = useStore();
  const [step, setStep] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [method, setMethod] = React.useState('upi');
  const [placing, setPlacing] = React.useState(false);
  const bill = computeBill(s.cartSubtotal, 0);

  React.useEffect(() => { if (s.cartItems.length === 0) s.nav('home'); }, []);
  if (s.cartItems.length === 0) return null;

  const addr = s.addresses.find((a) => a.id === s.selectedAddr) || s.addresses[0];

  const place = () => {
    setPlacing(true);
    setTimeout(() => {
      const payMeta = PAYMENTS.find((p) => p.id === method);
      const order = s.placeOrder({
        items: s.cartItems,
        address: addr,
        payment: { method, label: method === 'upi' ? 'UPI · aarav@okhdfc' : payMeta.label },
        totals: bill,
      });
      s.clearCart();
      s.nav('confirm', { id: order.id });
    }, 1100);
  };

  return (
    <div className="page checkout">
      <Crumbs items={[{ label: 'Cart', to: () => s.nav('cart') }, { label: 'Checkout' }]} />
      <div className="steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
            <span className="step-n">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>{label}
          </div>
        ))}
      </div>

      <div className="checkout-grid">
        <div className="checkout-main">
          {step === 0 && (
            <div className="co-block">
              <h2>Delivery address</h2>
              <div className="addr-list">
                {s.addresses.map((a) => (
                  <AddressCard key={a.id} a={a} selected={s.selectedAddr === a.id}
                    onSelect={() => s.setSelectedAddr(a.id)}
                    onEdit={() => { setEditing(a); setAdding(true); }} />
                ))}
              </div>
              {adding ? (
                <AddressForm initial={editing} onCancel={() => { setAdding(false); setEditing(null); }}
                  onSave={(f) => { const id = s.upsertAddress(editing ? { ...editing, ...f } : f); if (!editing) { /* select newest */ } s.showToast('Address saved'); setAdding(false); setEditing(null); }} />
              ) : (
                <button className="addr-add" onClick={() => { setEditing(null); setAdding(true); }}>
                  <Icon name="plusCircle" size={18} /> Add a new address
                </button>
              )}
              <div className="co-actions"><Button size="lg" iconRight="arrowR" onClick={() => setStep(1)}>Deliver here</Button></div>
            </div>
          )}

          {step === 1 && (
            <div className="co-block">
              <h2>Payment method</h2>
              <div className="pay-list">
                {PAYMENTS.map((p) => (
                  <div key={p.id} className={`pay-opt ${method === p.id ? 'on' : ''}`}>
                    <button className="pay-head" onClick={() => setMethod(p.id)}>
                      <span className="addr-radio">{method === p.id && <Icon name="check" size={14} />}</span>
                      <span className="pay-ico"><Icon name={p.icon} size={20} /></span>
                      <span className="pay-text"><b>{p.label}</b><i>{p.sub}</i></span>
                      {p.id === 'cod' && <span className="pay-tag">No charges</span>}
                    </button>
                    {method === p.id && <PaymentForms method={p.id} />}
                  </div>
                ))}
              </div>
              <div className="co-actions">
                <Button variant="ghost" onClick={() => setStep(0)} icon="back">Back</Button>
                <Button size="lg" iconRight="arrowR" onClick={() => setStep(2)}>Review order</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="co-block">
              <h2>Review & place order</h2>
              <div className="review-sec">
                <div className="review-head"><Icon name="pin" size={16} /> Delivering to <b>{addr.label}</b><button onClick={() => setStep(0)}>Change</button></div>
                <p className="review-addr">{addr.name} · {addr.phone}<br />{addr.line1}, {addr.line2}, {addr.city} – {addr.pin}</p>
              </div>
              <div className="review-sec">
                <div className="review-head"><Icon name={PAYMENTS.find((p) => p.id === method).icon} size={16} /> Paying via <b>{PAYMENTS.find((p) => p.id === method).label}</b><button onClick={() => setStep(1)}>Change</button></div>
              </div>
              <div className="review-sec">
                <div className="review-head"><Icon name="pkg" size={16} /> {s.cartCount} items</div>
                <div className="review-items">
                  {s.cartItems.map(({ product, qty }) => (
                    <div key={product.id} className="review-item">
                      <Img product={product} ratio="1 / 1" radius="8px" className="review-thumb" />
                      <span>{product.name} <i>× {qty}</i></span>
                      <b>{rupee(product.price * qty)}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="co-actions">
                <Button variant="ghost" onClick={() => setStep(1)} icon="back">Back</Button>
                <Button size="lg" disabled={placing} onClick={place}>
                  {placing ? 'Placing order…' : method === 'cod' ? `Place order · ${rupee(bill.grand)}` : `Pay ${rupee(bill.grand)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Order summary</h3>
            <div className="summary-eta"><Icon name="clock" size={16} /> Arriving in ~30 min</div>
            <BillRows bill={bill} />
            <p className="safe-note"><Icon name="shield" size={14} /> 256-bit secure checkout</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Order confirmation + tracking ──
const TRACK_STAGES = [
  { k: 'confirmed', icon: 'check', t: 'Order confirmed', d: 'We’ve received your order' },
  { k: 'packed', icon: 'pkg', t: 'Packed', d: 'Items picked & quality-checked' },
  { k: 'out', icon: 'truck', t: 'Out for delivery', d: 'Rider is on the way' },
  { k: 'delivered', icon: 'home', t: 'Delivered', d: 'Enjoy your fresh groceries!' },
];

function ConfirmScreen({ id }) {
  const s = useStore();
  const order = s.orders.find((o) => o.id === id) || s.orders[0];
  // Animate tracking progress for the demo
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1600),
      setTimeout(() => setStage(2), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  if (!order) return null;

  return (
    <div className="page confirm">
      <div className="confirm-hero">
        <div className="confirm-check"><Icon name="check" size={34} stroke={2.4} /></div>
        <h1>Order placed!</h1>
        <p>Thank you, {s.user ? s.user.name.split(' ')[0] : 'there'}. Your order <b>#{order.id}</b> is confirmed.</p>
        <div className="confirm-eta"><Icon name="clock" size={18} /> Arriving in <b>~{order.eta} minutes</b></div>
      </div>

      <div className="track-card">
        <h2>Track your order</h2>
        <div className="track">
          {TRACK_STAGES.map((st, i) => (
            <div key={st.k} className={`track-step ${i <= stage ? 'done' : ''} ${i === stage ? 'cur' : ''}`}>
              <div className="track-ico"><Icon name={i <= stage ? st.icon : 'clock'} size={18} /></div>
              <div className="track-meta"><b>{st.t}</b><i>{st.d}</i></div>
              {i === stage && i < 3 && <span className="track-live">In progress</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-grid confirm-grid">
        <div className="checkout-main">
          <div className="co-block">
            <h2>Order details</h2>
            <div className="review-items">
              {order.items.map((it) => (
                <div key={it.id} className="review-item">
                  <Img cat={s.D.catOf((s.D.find(it.id) || {}).cat || 'veggies')} ratio="1 / 1" radius="8px" className="review-thumb" label={it.name} />
                  <span>{it.name} <i>× {it.qty}</i></span>
                  <b>{rupee(it.price * it.qty)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Bill</h3>
            <BillRows bill={order.totals} />
            <div className="confirm-pay"><Icon name="check" size={14} /> Paid via {order.payment.label}</div>
            <Button variant="ghost" full onClick={() => s.nav('orders')} icon="receipt">View all orders</Button>
            <Button full iconRight="arrowR" onClick={() => s.nav('home')}>Continue shopping</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { CartScreen, CheckoutScreen, ConfirmScreen, computeBill, BillRows, AddressCard, AddressForm, Field, TRACK_STAGES });

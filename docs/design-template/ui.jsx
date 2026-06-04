/* FreshMart — shared UI primitives. */

// ── Icons (simple line set) ──────────────────────────────────────────────
const ICONS = {
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.3-4.3',
  cart: 'M3 4h2l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  heart: 'M12 20s-7-4.5-9.2-9A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9.2 5C19 15.5 12 20 12 20Z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  chevR: 'M9 6l6 6-6 6',
  chevL: 'M15 6l-6 6 6 6',
  chevD: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z',
  check: 'M5 12.5 10 17 19 7',
  pin: 'M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  pkg: 'M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l-1 4a2 2 0 0 1-2 1.5A14 14 0 0 1 3.5 6 2 2 0 0 1 5 4Z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  x: 'M6 6l12 12M18 6 6 18',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  tag: 'M3 12V4h8l9 9-8 8-9-9Zm5-4.5a1.5 1.5 0 1 0 0 .01',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  wallet: 'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V7Zm0 0V5a1 1 0 0 1 1-1h12M17 13h.01',
  card: 'M3 6h18v12H3zM3 10h18',
  cash: 'M3 6h18v12H3zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  bank: 'M4 10h16M5 10v8M19 10v8M9 10v8M15 10v8M3 18h18M12 3 4 7h16z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10 5.5A10 10 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3 3.5M6 7.5A16 16 0 0 0 2 12s4 7 10 7a10 10 0 0 0 3-.5M9.5 9.6A3 3 0 0 0 14 14',
  back: 'M19 12H5M11 6l-6 6 6 6',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  leaf: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14Zm0 0c2-5 5-8 9-9.5',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 8h8M8 12h8M8 16h5',
  plusCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v8m-4-4h8',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9v4m0-7h.01',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
};

function Icon({ name, size = 20, stroke = 1.8, className = '', style }) {
  const d = ICONS[name];
  const fill = name === 'star' ? 'currentColor' : 'none';
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ── Button ───────────────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', icon, iconRight, full, children, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${full ? 'btn-full' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

// ── Placeholder image tile (tinted by category, monospace label) ──────────
function Img({ product, cat, ratio = '1 / 1', label, className = '', radius }) {
  const c = product ? window.FM_DATA.catOf(product.cat) : cat;
  const tint = (c && c.tint) || '#EEF1F2';
  const ink = (c && c.ink) || '#566066';
  const text = label || (product ? product.name : 'product photo');
  return (
    <div className={`ph ${className}`} style={{ aspectRatio: ratio, background: tint, color: ink, borderRadius: radius }}>
      <div className="ph-stripes" />
      <span className="ph-label">{text}</span>
    </div>
  );
}

// ── Rating ─────────────────────────────────────────────────────────────────
function Rating({ value, reviews, size = 13 }) {
  return (
    <span className="rating">
      <Icon name="star" size={size} stroke={0} className="rating-star" />
      <b>{Number(value).toFixed(1)}</b>
      {reviews != null && <span className="rating-n">({reviews})</span>}
    </span>
  );
}

// ── Price ────────────────────────────────────────────────────────────────
const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN');
function Price({ value, mrp, size = 'md' }) {
  return (
    <span className={`price price-${size}`}>
      <b>{rupee(value)}</b>
      {mrp && mrp > value && (
        <>
          <s>{rupee(mrp)}</s>
          <span className="price-off">{Math.round((1 - value / mrp) * 100)}% off</span>
        </>
      )}
    </span>
  );
}

// ── Qty stepper ────────────────────────────────────────────────────────────
function QtyStepper({ qty, onChange, size = 'md' }) {
  if (!qty) {
    return (
      <button className={`qty-add qty-${size}`} onClick={() => onChange(1)}>
        <Icon name="plus" size={size === 'sm' ? 15 : 17} /> Add
      </button>
    );
  }
  return (
    <div className={`qty qty-${size}`}>
      <button onClick={() => onChange(qty - 1)} aria-label="Decrease"><Icon name="minus" size={15} /></button>
      <span>{qty}</span>
      <button onClick={() => onChange(qty + 1)} aria-label="Increase"><Icon name="plus" size={15} /></button>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const s = useStore();
  const qty = s.cart[product.id] || 0;
  return (
    <article className="pcard" onClick={() => s.nav('product', { id: product.id })}>
      <div className="pcard-img">
        <Img product={product} radius="calc(var(--radius-card) * 0.7)" />
        {product.tag && <span className="pcard-tag">{product.tag}</span>}
        {product.mrp && <span className="pcard-save">{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-unit">{product.unit}</div>
        <h3 className="pcard-name">{product.name}</h3>
        <Rating value={product.rating} reviews={product.reviews} />
        <div className="pcard-foot" onClick={(e) => e.stopPropagation()}>
          <Price value={product.price} mrp={product.mrp} size="sm" />
          <QtyStepper qty={qty} size="sm" onChange={(q) => s.setQty(product.id, q)} />
        </div>
      </div>
    </article>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction }) {
  return (
    <div className="sec-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && (
        <button className="sec-action" onClick={onAction}>
          {action} <Icon name="arrowR" size={16} />
        </button>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────
function Empty({ icon = 'cart', title, sub, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {children}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────
function Toast() {
  const { toast } = useStore();
  return <div className={`toast ${toast ? 'toast-on' : ''}`}>{toast && <><Icon name="check" size={16} /> {toast}</>}</div>;
}

Object.assign(window, {
  Icon, Button, Img, Rating, Price, QtyStepper, ProductCard, SectionHead, Empty, Toast, rupee,
});

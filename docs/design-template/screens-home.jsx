/* FreshMart — Home screen, with two hero layout variations. */

function CategoryPills() {
  const s = useStore();
  return (
    <section className="cat-grid-wrap">
      <div className="cat-grid">
        {s.D.CATEGORIES.map((c) => (
          <button key={c.id} className="cat-tile" onClick={() => s.nav('category', { id: c.id })}>
            <span className="cat-tile-img" style={{ background: c.tint, color: c.ink }}>
              <Icon name="leaf" size={26} stroke={1.6} />
            </span>
            <b>{c.name}</b>
            <i>{c.blurb}</i>
          </button>
        ))}
      </div>
    </section>
  );
}

function HeroBasket() {
  const s = useStore();
  return (
    <section className="hero hero-basket">
      <div className="hero-copy">
        <span className="hero-eyebrow"><Icon name="bolt" size={14} /> Delivery in 30 minutes</span>
        <h1>Fresh groceries,<br /><span>delivered fast.</span></h1>
        <p>From farm to your kitchen — fruits, vegetables, dairy and daily essentials, handpicked and delivered to your door.</p>
        <div className="hero-cta">
          <Button size="lg" iconRight="arrowR" onClick={() => s.nav('browse')}>Start shopping</Button>
          <Button size="lg" variant="ghost" onClick={() => s.nav('category', { id: 'fruits' })}>Today's deals</Button>
        </div>
        <div className="hero-stats">
          <div><b>30 min</b><i>Avg. delivery</i></div>
          <div><b>5,000+</b><i>Products</i></div>
          <div><b>4.8★</b><i>Customer rating</i></div>
        </div>
      </div>
      <div className="hero-art">
        <Img label="hero basket of fresh produce" ratio="1 / 1" className="hero-img" cat={{ tint: '#E7F3E4', ink: '#3C7A36' }} radius="calc(var(--radius-card) * 1.4)" />
        <div className="hero-chip hero-chip-1"><Icon name="truck" size={16} /> Out for delivery</div>
        <div className="hero-chip hero-chip-2"><Icon name="leaf" size={16} /> Sourced today</div>
      </div>
    </section>
  );
}

function HeroEditorial() {
  const s = useStore();
  return (
    <section className="hero hero-editorial">
      <div className="hero-ed-main">
        <Img label="seasonal produce flatlay" ratio="16 / 11" cat={{ tint: '#E7F3E4', ink: '#3C7A36' }} radius="calc(var(--radius-card))" />
        <div className="hero-ed-overlay">
          <span className="hero-eyebrow light"><Icon name="bolt" size={14} /> In season now</span>
          <h1>Eat fresh,<br />live well.</h1>
          <p>Handpicked seasonal produce at honest prices.</p>
          <Button size="lg" iconRight="arrowR" onClick={() => s.nav('browse')}>Shop the season</Button>
        </div>
      </div>
      <div className="hero-ed-side">
        <button className="hero-ed-card" style={{ background: '#FCEFD9' }} onClick={() => s.nav('category', { id: 'fruits' })}>
          <div><span className="hero-eyebrow">Sweet & juicy</span><h3>Fresh fruits</h3><i>Up to 20% off →</i></div>
          <Img label="fruit" ratio="1 / 1" cat={{ tint: 'transparent', ink: '#9A6B16' }} className="hero-ed-thumb" radius="14px" />
        </button>
        <button className="hero-ed-card" style={{ background: '#F1F4FB' }} onClick={() => s.nav('category', { id: 'dairy' })}>
          <div><span className="hero-eyebrow">Daily fresh</span><h3>Dairy & eggs</h3><i>Delivered chilled →</i></div>
          <Img label="dairy" ratio="1 / 1" cat={{ tint: 'transparent', ink: '#3F5A93' }} className="hero-ed-thumb" radius="14px" />
        </button>
      </div>
    </section>
  );
}

function Rail({ title, sub, products, action }) {
  const s = useStore();
  return (
    <section className="rail-sec">
      <SectionHead title={title} sub={sub} action={action} onAction={() => s.nav('browse')} />
      <div className="rail">
        {products.map((p) => (
          <div className="rail-item" key={p.id}><ProductCard product={p} /></div>
        ))}
      </div>
    </section>
  );
}

function PromoStrip() {
  return (
    <section className="promo">
      <div className="promo-item"><Icon name="truck" size={22} /><div><b>Free delivery</b><i>On orders over ₹199</i></div></div>
      <div className="promo-item"><Icon name="clock" size={22} /><div><b>30-minute delivery</b><i>From dark stores near you</i></div></div>
      <div className="promo-item"><Icon name="leaf" size={22} /><div><b>Farm fresh</b><i>Sourced & packed daily</i></div></div>
      <div className="promo-item"><Icon name="shield" size={22} /><div><b>Quality promise</b><i>Not fresh? Full refund</i></div></div>
    </section>
  );
}

function HomeScreen({ layout }) {
  const s = useStore();
  return (
    <div className="page home">
      {layout === 'editorial' ? <HeroEditorial /> : <HeroBasket />}
      <PromoStrip />
      <SectionHead title="Shop by category" />
      <CategoryPills />
      <Rail title="Best sellers" sub="What everyone's adding to cart" products={s.D.bestsellers} action="View all" />
      <section className="banner">
        <div className="banner-copy">
          <span className="hero-eyebrow light"><Icon name="tag" size={14} /> Weekend savings</span>
          <h2>Up to 30% off on staples</h2>
          <p>Stock up on rice, dal, atta and oils. Limited-time prices, refreshed every week.</p>
          <Button variant="onbrand" iconRight="arrowR" onClick={() => s.nav('category', { id: 'staples' })}>Shop staples</Button>
        </div>
        <Img label="pantry staples" ratio="3 / 2" cat={{ tint: 'rgba(255,255,255,.18)', ink: 'rgba(255,255,255,.9)' }} className="banner-img" radius="calc(var(--radius-card))" />
      </section>
      <Rail title="Today's deals" sub="Fresh markdowns, while stocks last" products={s.D.deals} action="View all" />
    </div>
  );
}

Object.assign(window, { HomeScreen });

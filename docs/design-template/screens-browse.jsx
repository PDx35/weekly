/* FreshMart — Browse / Category / Search / Product detail. */

function ProductGrid({ products }) {
  return (
    <div className="pgrid">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// Shared sort + a tiny filter rail
function useSortFilter(products) {
  const [sort, setSort] = React.useState('pop');
  const [onlyDeals, setOnlyDeals] = React.useState(false);
  let list = onlyDeals ? products.filter((p) => p.mrp) : products.slice();
  if (sort === 'lo') list.sort((a, b) => a.price - b.price);
  else if (sort === 'hi') list.sort((a, b) => b.price - a.price);
  else if (sort === 'rate') list.sort((a, b) => b.rating - a.rating);
  return { list, sort, setSort, onlyDeals, setOnlyDeals };
}

function SortBar({ count, sort, setSort, onlyDeals, setOnlyDeals }) {
  const opts = [['pop', 'Popularity'], ['lo', 'Price: low to high'], ['hi', 'Price: high to low'], ['rate', 'Top rated']];
  return (
    <div className="sortbar">
      <span className="sortbar-count">{count} items</span>
      <div className="sortbar-right">
        <button className={`chip ${onlyDeals ? 'chip-on' : ''}`} onClick={() => setOnlyDeals((v) => !v)}>
          <Icon name="tag" size={14} /> On offer
        </button>
        <label className="sortbar-sort">
          <Icon name="filter" size={15} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

function Crumbs({ items }) {
  const s = useStore();
  return (
    <nav className="crumbs">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevR" size={13} />}
          {it.to ? <button onClick={it.to}>{it.label}</button> : <span>{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function BrowseScreen() {
  const s = useStore();
  return (
    <div className="page browse">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'All categories' }]} />
      <h1 className="page-title">All categories</h1>
      {s.D.CATEGORIES.map((c) => {
        const items = s.D.byCat(c.id);
        return (
          <section className="cat-block" key={c.id}>
            <SectionHead title={c.name} sub={c.blurb} action="See all" onAction={() => s.nav('category', { id: c.id })} />
            <div className="rail">
              {items.slice(0, 6).map((p) => <div className="rail-item" key={p.id}><ProductCard product={p} /></div>)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CategoryScreen({ id }) {
  const s = useStore();
  const cat = s.D.catOf(id);
  const all = s.D.byCat(id);
  const sf = useSortFilter(all);
  return (
    <div className="page category">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Categories', to: () => s.nav('browse') }, { label: cat.name }]} />
      <header className="cat-hero" style={{ background: cat.tint, color: cat.ink }}>
        <div>
          <h1>{cat.name}</h1>
          <p>{cat.blurb} · {all.length} products</p>
        </div>
        <span className="cat-hero-ico"><Icon name="leaf" size={40} stroke={1.4} /></span>
      </header>
      <SortBar count={sf.list.length} {...sf} />
      <ProductGrid products={sf.list} />
    </div>
  );
}

function SearchScreen({ q }) {
  const s = useStore();
  const [query, setQuery] = React.useState(q || '');
  const matches = query.trim()
    ? s.D.PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        s.D.catName(p.cat).toLowerCase().includes(query.toLowerCase()))
    : [];
  const sf = useSortFilter(matches);
  // category chips suggested from matches
  const cats = [...new Set(matches.map((p) => p.cat))];
  return (
    <div className="page search-page">
      <Crumbs items={[{ label: 'Home', to: () => s.nav('home') }, { label: 'Search' }]} />
      <h1 className="page-title">Results for “{query}”</h1>
      {cats.length > 1 && (
        <div className="search-cats">
          {cats.map((c) => (
            <button key={c} className="chip" onClick={() => s.nav('category', { id: c })}>{s.D.catName(c)}</button>
          ))}
        </div>
      )}
      {matches.length === 0 ? (
        <Empty icon="search" title={`No results for “${query}”`} sub="Try a different spelling, or browse our categories.">
          <Button onClick={() => s.nav('browse')} iconRight="arrowR">Browse categories</Button>
        </Empty>
      ) : (
        <>
          <SortBar count={sf.list.length} {...sf} />
          <ProductGrid products={sf.list} />
        </>
      )}
    </div>
  );
}

function ProductScreen({ id }) {
  const s = useStore();
  const p = s.D.find(id);
  const [activeImg, setActiveImg] = React.useState(0);
  if (!p) return <div className="page"><Empty icon="pkg" title="Product not found" /></div>;
  const qty = s.cart[p.id] || 0;
  const cat = s.D.catOf(p.cat);
  const related = s.D.byCat(p.cat).filter((x) => x.id !== p.id).slice(0, 5);
  const highlights = [
    { ico: 'truck', t: 'Delivered in 30 min' },
    { ico: 'leaf', t: 'Sourced & packed today' },
    { ico: 'shield', t: 'Freshness guaranteed' },
    { ico: 'pkg', t: 'Cold-chain handled' },
  ];

  return (
    <div className="page product">
      <Crumbs items={[
        { label: 'Home', to: () => s.nav('home') },
        { label: cat.name, to: () => s.nav('category', { id: cat.id }) },
        { label: p.name },
      ]} />

      <div className="pd">
        <div className="pd-gallery">
          <div className="pd-main">
            <Img product={p} label={`${p.name} — view ${activeImg + 1}`} ratio="1 / 1" radius="calc(var(--radius-card))" />
            {p.tag && <span className="pcard-tag pd-tag">{p.tag}</span>}
          </div>
          <div className="pd-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className={`pd-thumb ${activeImg === i ? 'on' : ''}`} onClick={() => setActiveImg(i)}>
                <Img product={p} label={['front', 'pack', 'detail', 'use'][i]} ratio="1 / 1" radius="10px" />
              </button>
            ))}
          </div>
        </div>

        <div className="pd-info">
          <div className="pd-unit">{p.unit}</div>
          <h1>{p.name}</h1>
          <div className="pd-rate"><Rating value={p.rating} reviews={p.reviews} size={16} /><span className="pd-instock"><Icon name="check" size={14} /> In stock</span></div>
          <Price value={p.price} mrp={p.mrp} size="lg" />
          <p className="pd-tax">Inclusive of all taxes</p>

          <p className="pd-desc">{p.desc || 'Fresh, high-quality produce handpicked for your daily needs. Stored and delivered with care to preserve taste and nutrition.'}</p>

          <div className="pd-buy">
            <QtyStepper qty={qty} onChange={(q) => s.setQty(p.id, q)} />
            <Button size="lg" full icon="cart" onClick={() => { if (!qty) s.addToCart(p.id); s.nav('cart'); }}>
              {qty ? 'Go to cart' : 'Add to cart'}
            </Button>
          </div>

          <div className="pd-highlights">
            {highlights.map((h) => (
              <div key={h.t} className="pd-hl"><Icon name={h.ico} size={18} /><span>{h.t}</span></div>
            ))}
          </div>

          <div className="pd-acc">
            <details open>
              <summary>Product details <Icon name="chevD" size={16} /></summary>
              <ul>
                <li><span>Category</span><b>{cat.name}</b></li>
                <li><span>Net quantity</span><b>{p.unit}</b></li>
                <li><span>Shelf life</span><b>Best within 3–5 days</b></li>
                <li><span>Storage</span><b>Refrigerate after delivery</b></li>
                <li><span>Country of origin</span><b>India</b></li>
              </ul>
            </details>
            <details>
              <summary>Delivery & returns <Icon name="chevD" size={16} /></summary>
              <p>Delivered in ~30 minutes from your nearest FreshMart store. Not happy with the freshness? Report at delivery for an instant refund — no questions asked.</p>
            </details>
          </div>
        </div>
      </div>

      <section className="rail-sec">
        <SectionHead title="You might also like" />
        <div className="rail">
          {related.map((r) => <div className="rail-item" key={r.id}><ProductCard product={r} /></div>)}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { BrowseScreen, CategoryScreen, SearchScreen, ProductScreen, Crumbs, ProductGrid });

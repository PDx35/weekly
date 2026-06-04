/* FreshMart — root app: routing, tweaks, theme application. */

const PALETTES = {
  garden:  ['#2C8C5A', '#1E6B43', '#E9F4ED'],
  teal:    ['#0F8A82', '#0A645E', '#E2F1F0'],
  berry:   ['#BE3A66', '#922B4C', '#FBE8EE'],
  harvest: ['#D9772E', '#AE591C', '#FBEEE0'],
};
const FONTS = {
  grotesque: { head: "'Bricolage Grotesque'", body: "'Hanken Grotesque'" },
  clean:     { head: "'Space Grotesk'",       body: "'Hanken Grotesque'" },
  friendly:  { head: "'Fredoka'",             body: "'Nunito Sans'" },
};
const DENSITY = {
  compact: { pad: 14, gap: 12, base: 15 },
  cozy:    { pad: 20, gap: 18, base: 16 },
  airy:    { pad: 28, gap: 24, base: 17 },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#2C8C5A", "#1E6B43", "#E9F4ED"],
  "font": "grotesque",
  "cardStyle": "rounded",
  "density": "cozy",
  "footer": "dark",
  "homeLayout": "basket"
}/*EDITMODE-END*/;

function applyTheme(t) {
  const r = document.documentElement.style;
  const [brand, brand700, tint] = t.palette;
  r.setProperty('--brand', brand);
  r.setProperty('--brand-700', brand700);
  r.setProperty('--brand-050', tint);
  const f = FONTS[t.font] || FONTS.grotesque;
  r.setProperty('--font-head', f.head + ', system-ui, sans-serif');
  r.setProperty('--font-body', f.body + ', system-ui, sans-serif');
  r.setProperty('--radius-card', t.cardStyle === 'sharp' ? '5px' : '18px');
  r.setProperty('--radius-btn', t.cardStyle === 'sharp' ? '5px' : '12px');
  const d = DENSITY[t.density] || DENSITY.cozy;
  r.setProperty('--pad', d.pad + 'px');
  r.setProperty('--gap', d.gap + 'px');
  r.setProperty('--base', d.base + 'px');
}

const LayoutCtx = React.createContext('basket');

function Router() {
  const s = useStore();
  const layout = React.useContext(LayoutCtx);
  const { name, params } = s.route;
  switch (name) {
    case 'auth':       return <AuthScreen />;
    case 'home':       return <HomeScreen layout={layout} />;
    case 'browse':     return <BrowseScreen />;
    case 'category':   return <CategoryScreen id={params.id} />;
    case 'search':     return <SearchScreen q={params.q} />;
    case 'product':    return <ProductScreen id={params.id} />;
    case 'cart':       return <CartScreen />;
    case 'checkout':   return <CheckoutScreen />;
    case 'confirm':    return <ConfirmScreen id={params.id} />;
    case 'orders':     return <OrdersScreen />;
    case 'account':    return <AccountScreen />;
    case 'addresses':  return <AddressesScreen />;
    case 'support':    return <SupportScreen />;
    default:           return <HomeScreen layout="basket" />;
  }
}

function Shell() {
  const s = useStore();
  const isAuth = s.route.name === 'auth';
  if (isAuth) return <><Router /><Toast /></>;
  return (
    <div className="app">
      <Header />
      <MobileTop />
      <main className="main">
        <Router />
      </main>
      <Footer />
      <MobileNav />
      <Toast />
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTheme(t); }, [t]);
  React.useEffect(() => { document.documentElement.dataset.footer = t.footer; }, [t.footer]);

  return (
    <StoreProvider>
      <LayoutCtx.Provider value={t.homeLayout}>
        <Shell />
      </LayoutCtx.Provider>
      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Brand colour" value={t.palette}
          options={[PALETTES.garden, PALETTES.teal, PALETTES.berry, PALETTES.harvest]}
          onChange={(v) => setTweak('palette', v)} />
        <TweakSection label="Type & layout" />
        <TweakSelect label="Font pairing" value={t.font}
          options={[{ value: 'grotesque', label: 'Grotesque (default)' }, { value: 'clean', label: 'Clean & modern' }, { value: 'friendly', label: 'Friendly & round' }]}
          onChange={(v) => setTweak('font', v)} />
        <TweakRadio label="Card style" value={t.cardStyle} options={[{ value: 'rounded', label: 'Rounded' }, { value: 'sharp', label: 'Sharp' }]} onChange={(v) => setTweak('cardStyle', v)} />
        <TweakRadio label="Density" value={t.density} options={['compact', 'cozy', 'airy']} onChange={(v) => setTweak('density', v)} />
        <TweakRadio label="Home hero" value={t.homeLayout} options={[{ value: 'basket', label: 'Basket' }, { value: 'editorial', label: 'Editorial' }]} onChange={(v) => setTweak('homeLayout', v)} />
        <TweakSection label="Footer" />
        <TweakRadio label="Footer theme" value={t.footer} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} onChange={(v) => setTweak('footer', v)} />
      </TweaksPanel>
    </StoreProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

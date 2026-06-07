'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useServiceability } from '@/store/serviceability';
import { routes } from '@/lib/routes';

// Fallback image helper based on product names
const getProductImage = (p: any): string => {
  if (p.images && p.images.length > 0 && p.images[0]) {
    return p.images[0];
  }
  const name = p.name.toLowerCase();
  if (name.includes('mango')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=300';
  if (name.includes('banana')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=300';
  if (name.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=300';
  if (name.includes('pomegranate')) return 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=300';
  if (name.includes('lime') || name.includes('lemon')) return 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&q=80&w=300';
  if (name.includes('grape')) return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=300';
  if (name.includes('coconut')) return 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=300';
  if (name.includes('tomato')) return 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=300';
  if (name.includes('onion')) return 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=300';
  if (name.includes('potato')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300';
  if (name.includes('spinach')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=300';
  if (name.includes('broccoli')) return 'https://images.unsplash.com/photo-1453906053752-ec7a2995a899?auto=format&fit=crop&q=80&w=300';
  if (name.includes('capsicum') || name.includes('pepper')) return 'https://images.unsplash.com/photo-1563565038-a53517c5bacc?auto=format&fit=crop&q=80&w=300';
  if (name.includes('milk')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300';
  if (name.includes('egg')) return 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=300';
  if (name.includes('yogurt')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=300';
  if (name.includes('butter')) return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300';
  if (name.includes('cheese')) return 'https://images.unsplash.com/photo-1486299267070-8382e040730b?auto=format&fit=crop&q=80&w=300';
  if (name.includes('paneer')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=300';
  if (name.includes('bread') || name.includes('croissant') || name.includes('bun') || name.includes('muffin')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300';
  if (name.includes('juice') || name.includes('tea') || name.includes('coffee') || name.includes('water')) return 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&q=80&w=300';
  if (name.includes('almond') || name.includes('nut') || name.includes('honey') || name.includes('cashew')) return 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=300';
  if (name.includes('rice') || name.includes('dal') || name.includes('atta') || name.includes('oil') || name.includes('salt')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300';
  if (name.includes('carrot')) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=300';
  if (name.includes('strawberry')) return 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=300';
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
};

// Fallback emoji helper for categories
const getCategoryEmoji = (id: string, name: string): string => {
  const q = (id + ' ' + name).toLowerCase();
  if (q.includes('onion')) return '🧅';
  if (q.includes('fruit') || q.includes('apple') || q.includes('strawberry') || q.includes('mango')) return '🍓';
  if (q.includes('veggie') || q.includes('veg') || q.includes('broccoli') || q.includes('greens')) return '🥦';
  if (q.includes('apple')) return '🍎';
  if (q.includes('orange') || q.includes('citrus')) return '🍊';
  if (q.includes('potato')) return '🥔';
  if (q.includes('carrot')) return '🥕';
  if (q.includes('milk') || q.includes('dairy') || q.includes('cheese') || q.includes('egg')) return '🥚';
  if (q.includes('bakery') || q.includes('bread')) return '🍞';
  if (q.includes('bev') || q.includes('juice') || q.includes('coffee') || q.includes('tea')) return '🥤';
  if (q.includes('snack') || q.includes('nut') || q.includes('chip') || q.includes('almond')) return '🥜';
  return '🥗';
};

const BG_CLASSES = [
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-700',
  'bg-red-100 text-red-700',
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
];

export default function HomePage() {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { user, addresses, selectedAddr } = useAuth();
  const { pincode, detect, locationName } = useServiceability();

  const activeAddr = addresses?.find((a) => a.id === selectedAddr) || addresses?.[0];

  useEffect(() => {
    if (!pincode && !activeAddr) {
      detect();
    }
  }, [pincode, activeAddr, detect]);

  const locationLabel = activeAddr?.label 
    || (locationName && pincode 
        ? `${locationName} (${pincode})` 
        : locationName || pincode || 'Set location');

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json())
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load dynamic storefront data:", err);
      setLoading(false);
    });
  }, []);

  const getCategoryProductCount = (catId: string) => {
    return products.filter((p) => p.cat === catId).length;
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeTab !== 'all') {
      result = result.filter((p) => p.cat === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    // Limit to first 8 for "Best Selling" visual alignment
    return result.slice(0, 8);
  }, [activeTab, searchQuery, products]);

  // Deal products for Weekly Hot Deals
  const dealProducts = useMemo(() => {
    return products.filter((p) => p.mrp).slice(0, 4);
  }, [products]);

  const handleAddToCart = (productId: string) => {
    addToCart(productId, 1);
  };

  return (
    <div className="growexy-page min-h-screen bg-white font-sans text-neutral-900 pb-16">
      {/* Dynamic CSS Injection to hide default storefront layout chrome */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .app > .hdr,
          .app > .mobtop,
          .app > .footer {
            display: none !important;
          }
          .main {
            padding: 0 !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `
      }} />

      {/* GROWEXY HEADER */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-4">
            <Link href={routes.home()} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </span>
              <span>
                Grow<span className="text-emerald-600 font-extrabold">exy</span>
              </span>
            </Link>

            {/* Location Selector (Auto-fetched & Manual) */}
            <button 
              onClick={() => router.push(routes.addresses())}
              className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50/60 px-3.5 py-1.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left max-w-[200px] sm:max-w-[240px] truncate"
            >
              <span className="text-emerald-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div className="flex flex-col text-[10px] sm:text-xs">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight leading-none">Deliver to</span>
                <span className="font-extrabold text-neutral-800 truncate mt-0.5 max-w-[120px] sm:max-w-[150px] leading-tight">{locationLabel}</span>
              </div>
            </button>
          </div>

          {/* Icons & Account */}
          <div className="flex items-center gap-4">
            {/* Search Box Trigger */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-2 text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
              </span>
            </div>

            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>

            <Link href={routes.cart()} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href={user ? routes.account() : routes.auth()}
              className="flex h-9 items-center justify-center rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              {user ? user.name.split(' ')[0] : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d2efff] via-[#e6f5ff] to-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-6 max-w-xl z-10">
            <span className="inline-block rounded-full bg-white/80 px-4 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase shadow-sm">
              Fresh & Authentic
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-neutral-900 leading-tight">
              DELICIOUS SNACKS TO CURB YOUR HUNGER
            </h1>
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
              Our organic whole milk comes from pasture-raised cows, free from synthetic hormones and antibiotics, delivering a rich and creamy taste.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Link href={routes.browse()} className="flex items-center gap-3 rounded-full bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold px-6 py-3.5 shadow-lg shadow-amber-100 transition-all group">
                <span>Shop Now</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white group-hover:translate-x-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </Link>
              <div className="text-sm text-neutral-600 font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>2400+ Fresh Products</span>
              </div>
            </div>
          </div>
          <div className="relative flex-1 flex justify-center md:justify-end z-10 w-full max-w-md md:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/growexy_hero_delivery_guy.png"
              alt="Delivery Person holding vegetable basket"
              className="w-full max-w-md md:max-w-lg object-contain rounded-2xl hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* DYNAMIC POPULAR CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16 text-center space-y-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase">
          Our Popular Categories
        </h2>
        {loading ? (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar flex-nowrap">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="h-32 w-28 flex-shrink-0 rounded-full bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar flex-nowrap justify-start md:justify-center">
            {categories.slice(0, 14).map((cat, i) => (
              <Link
                key={cat.id}
                href={routes.category(cat.id)}
                className="flex flex-col items-center justify-center flex-shrink-0 w-24 group transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center text-4xl group-hover:scale-110 active:scale-95 duration-200 ease-out transition-transform select-none">
                  {cat.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.iconUrl} alt={cat.name} className="h-16 w-16 object-contain" />
                  ) : (
                    getCategoryEmoji(cat.id, cat.name)
                  )}
                </div>
                <span className="mt-3 font-bold text-neutral-900 text-xs tracking-tight capitalize truncate w-full text-center group-hover:text-emerald-600 transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SEASONAL OFFERS */}
      <section className="mx-auto max-w-7xl px-6 py-4 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 uppercase">
            Our Seasonal Offers
          </h2>
          <Link href={routes.browse()} className="flex items-center gap-2 rounded-full border border-neutral-200 hover:border-neutral-900 px-5 py-2 text-xs font-bold tracking-tight text-neutral-950 transition-all group">
            <span>Shop Now</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white group-hover:translate-x-1 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </Link>
        </div>

        {/* Banner 1: Big landscape banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#e0f4ff] via-[#f0f9ff] to-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-md z-10 text-left">
            <span className="inline-block rounded-full bg-emerald-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Fresh Vegetables
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 leading-tight">
              EVERYDAY FRESH WITH ORGANICS FOODS
            </h3>
          </div>
          <div className="relative w-full max-w-sm md:max-w-md z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/growexy_organic_basket.png"
              alt="Organic basket of foods"
              className="w-full object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Promo cards below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card Left: Best Deals */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-950 text-white p-8 md:p-12 flex flex-row items-center justify-between gap-4">
            <div className="space-y-3 max-w-[55%] text-left">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Sales of the month</span>
              <h4 className="text-xl md:text-2xl font-black uppercase leading-snug">BEST DEALS OF THIS WEEK!</h4>
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-xs px-3 py-1.5 shadow-sm shadow-amber-200">
                15% OFF
              </span>
            </div>
            <div className="w-[40%] flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/growexy_fresh_fruits.png" alt="Fresh fruits pile" className="w-full max-h-36 object-contain rounded-xl" />
            </div>
          </div>

          {/* Card Right: Organic Foods */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-50 border border-emerald-100 text-neutral-900 p-8 md:p-12 flex flex-row items-center justify-between gap-4">
            <div className="space-y-3 max-w-[55%] text-left">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Sales of the month</span>
              <h4 className="text-xl md:text-2xl font-black uppercase leading-snug">ORGANIC FRESH FOODS</h4>
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-xs px-3 py-1.5 shadow-sm shadow-amber-200">
                20% OFF
              </span>
            </div>
            <div className="w-[40%] flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/growexy_carrots_basket.png" alt="Carrots basket" className="w-full max-h-36 object-contain rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC BEST SELLING PRODUCT */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-10 text-center">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase">
            Our Best Selling Product
          </h2>
          <p className="text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
            Discover our fresh organic selections, sourced directly from local eco-farms to provide the highest nutritional quality.
          </p>
        </div>

        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${
                activeTab === cat.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-80 rounded-3xl bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-neutral-500 py-10 font-medium">No products found in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const hasDiscount = p.mrp && p.mrp > p.price;
              const discountPercent = hasDiscount ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm hover:shadow-xl hover:shadow-neutral-50 hover:border-emerald-100 transition-all"
                >
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span className="absolute left-4 top-4 z-10 rounded-lg bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1">
                      -{discountPercent}%
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <button className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </button>

                  {/* Image */}
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Body */}
                  <div className="mt-4 space-y-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="flex text-amber-400">
                        {'★'.repeat(Math.ceil(p.rating || 5))}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-800">({(p.rating || 5.0).toFixed(1)})</span>
                    </div>
                    <h3 className="font-bold text-neutral-900 text-base truncate">{p.name}</h3>
                    <p className="text-xs font-semibold text-neutral-400">{p.unit || 'Each'}</p>

                    {/* Price and Add button */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-emerald-700 text-lg">₹{p.price}</span>
                        {hasDiscount && (
                          <s className="text-xs text-neutral-400 font-semibold">₹{p.mrp}</s>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(p.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* WEEKLY HOT DEALS */}
      <section className="mx-auto max-w-7xl px-6 py-4 space-y-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 text-center uppercase">
          Our Weekly Hot Deals
        </h2>

        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#f2e6ff] via-[#f7f0ff] to-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-md z-10 text-left">
            <span className="inline-block rounded-full bg-purple-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Fresh, Premium Drinks
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 leading-tight uppercase">
              Fresh, Premium Drinks From The Farm.
            </h3>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-400 font-black text-neutral-950 text-sm shadow-lg shadow-amber-100 flex-col leading-none">
              <span>30%</span>
              <span className="text-[10px] tracking-wider uppercase mt-0.5">Off</span>
            </div>
          </div>
          <div className="relative w-full max-w-sm md:max-w-md z-10 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/growexy_almonds_bowl.png"
              alt="Premium raw almonds bowl"
              className="w-full max-h-56 object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Small deal grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-80 rounded-3xl bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : dealProducts.length === 0 ? (
          <p className="text-neutral-500 py-6 text-center font-medium">No active discounted deals at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
            {dealProducts.map((p) => {
              const hasDiscount = p.mrp && p.mrp > p.price;
              const discountPercent = hasDiscount ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm hover:shadow-xl hover:shadow-neutral-50 transition-all"
                >
                  {/* Image */}
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Body */}
                  <div className="mt-4 space-y-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="flex text-amber-400">
                        {'★'.repeat(Math.ceil(p.rating || 5))}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-800">({(p.rating || 5).toFixed(1)})</span>
                    </div>
                    <h3 className="font-bold text-neutral-900 text-base truncate">{p.name}</h3>
                    <p className="text-xs font-semibold text-neutral-400">{p.unit || 'Each'}</p>

                    {/* Price and Add button */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-emerald-700 text-lg">₹{p.price}</span>
                        {hasDiscount && (
                          <s className="text-xs text-neutral-400 font-semibold">₹{p.mrp}</s>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(p.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-7xl px-6 pt-16 mt-16 border-t border-neutral-100 text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link href={routes.home()} className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </span>
              <span>
                Grow<span className="text-emerald-600 font-extrabold">exy</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              Growexy is your premier local green grocer, providing farm-fresh produce, natural dairy, and raw organics delivered directly to your doorstep.
            </p>
          </div>

          {/* About Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href="#" className="hover:text-emerald-600">About Us</Link></li>
              <li><Link href={routes.browse()} className="hover:text-emerald-600">Shop Catalog</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Our Brands</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Partner Program</Link></li>
            </ul>
          </div>

          {/* Help Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Support</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href={routes.support()} className="hover:text-emerald-600">Help Center</Link></li>
              <li><Link href={routes.addresses()} className="hover:text-emerald-600">Delivery Areas</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Terms of Use</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Contact Us</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Have questions? Reach out at:
              <br />
              <strong className="text-neutral-800">support@growexy.com</strong>
            </p>
            <div className="flex gap-2">
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                F
              </span>
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                T
              </span>
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                I
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Growexy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

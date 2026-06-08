'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useServiceability } from '@/store/serviceability';
import { routes } from '@/lib/routes';
import { ProductCard, ProductCardCompact, ProductCardOffer } from '@/components/ui/ProductCard';

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

function FlashSaleTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 14, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 2;
              minutes = 0;
              seconds = 0;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold">
      <span className="bg-red-600 text-white px-2 py-1 rounded-md shadow-sm">{pad(timeLeft.hours)}</span>
      <span className="text-red-600 font-bold">:</span>
      <span className="bg-red-600 text-white px-2 py-1 rounded-md shadow-sm">{pad(timeLeft.minutes)}</span>
      <span className="text-red-600 font-bold">:</span>
      <span className="bg-red-600 text-white px-2 py-1 rounded-md shadow-sm">{pad(timeLeft.seconds)}</span>
    </div>
  );
}

function AutoScrollingPromoCarousel({ banners, fallbackList, onBannerClick }: { banners: any[]; fallbackList: Array<{ bgColor: string; title: string; subtitle?: string; imageUrl: string; ctaText?: string }>; onBannerClick: (b: any) => void }) {
  const list = banners.length > 0 ? banners : fallbackList;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (list.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [list, isPaused]);

  if (!list || list.length === 0) return null;

  const current = list[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-4">
      <div
        className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-neutral-100 shadow-sm transition-all duration-500 ease-in-out min-h-[160px] sm:min-h-[180px]"
        style={{ backgroundColor: current.bgColor || '#f0fdf4' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation Arrows */}
        {list.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-xs text-neutral-800 shadow-xs hover:bg-white transition-colors"
              aria-label="Previous Banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-xs text-neutral-800 shadow-xs hover:bg-white transition-colors"
              aria-label="Next Banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </>
        )}

        {/* Text Area */}
        <div className="flex-1 space-y-2 max-w-md z-10 text-left">
          {current.subtitle && (
            <span className="inline-block rounded-full bg-black/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-800 leading-none">
              {current.subtitle}
            </span>
          )}
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight uppercase">
            {current.title}
          </h3>
          <button
            onClick={() => current.id ? onBannerClick(current) : null}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-950 text-white font-extrabold text-[9px] px-3.5 py-1.5 mt-1 transition-transform hover:scale-105 active:scale-95 leading-none"
            style={{ color: current.ctaColor || '#ffffff' }}
          >
            {current.ctaText || current.cta || 'Shop Now'}
          </button>
        </div>

        {/* Image Area */}
        <div className="relative w-full max-w-xs md:max-w-sm z-10 flex justify-center md:justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrlDesktop || current.imageUrl || current.imageUrlMobile}
            alt={current.title}
            className="w-full max-h-[140px] object-contain rounded-xl transition-all duration-300 hover:scale-102"
            loading="lazy"
          />
        </div>

        {/* Indicators */}
        {list.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {list.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'bg-neutral-800 w-3' : 'bg-neutral-800/20'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoBannerRow({ banners, fallbackList, onBannerClick }: { banners: any[]; fallbackList: Array<{ bgColor: string; title: string; subtitle?: string; imageUrl: string; ctaText?: string }>; onBannerClick: (b: any) => void }) {
  // Use banners if available, else use fallbackList
  const list = banners.length > 0 ? banners : fallbackList;
  if (!list || list.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-4">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-nowrap scroll-smooth snap-x">
        {list.map((item, idx) => {
          const isDbBanner = !!item.id;
          const bg = item.bgColor || '#f0fdf4';
          const title = item.title;
          const subtitle = item.subtitle;
          const img = item.imageUrlDesktop || item.imageUrl || item.imageUrlMobile;
          const cta = item.ctaText || item.cta || 'Shop Now';
          const ctaCol = item.ctaColor || '#ffffff';

          return (
            <div
              key={item.id || idx}
              onClick={() => isDbBanner ? onBannerClick(item) : null}
              className={`relative flex-shrink-0 w-[290px] sm:w-[340px] md:w-[380px] h-[150px] sm:h-[160px] rounded-2xl overflow-hidden p-5 flex items-center justify-between gap-3 border border-neutral-100 shadow-sm snap-start transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isDbBanner ? 'cursor-pointer' : ''}`}
              style={{ backgroundColor: bg }}
            >
              {/* Text Area */}
              <div className="flex flex-col justify-between h-full text-left max-w-[60%] z-10">
                <div className="space-y-1">
                  {subtitle && (
                    <span className="inline-block rounded-full bg-black/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-800 leading-none">
                      {subtitle}
                    </span>
                  )}
                  <h3 className="text-sm sm:text-base font-black text-neutral-900 leading-tight line-clamp-3 uppercase">
                    {title}
                  </h3>
                </div>

                <div>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-neutral-950 text-white font-extrabold text-[9px] px-3 py-1.5 transition-transform hover:scale-105 active:scale-95 leading-none"
                    style={{ color: ctaCol }}
                  >
                    {cta}
                  </button>
                </div>
              </div>

              {/* Image Area */}
              <div className="relative w-[40%] h-full flex items-center justify-center z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={title}
                  className="max-w-full max-h-[110px] object-contain rounded-lg hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Decorative Background Blob */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HeroCarousel({ banners, onBannerClick }: { banners: any[]; onBannerClick: (b: any) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const current = banners[currentIndex];
  if (!current) return null;

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-500 min-h-[350px]"
      style={{ backgroundColor: current.bgColor || '#d2efff' }}
    >
      <div className="flex-1 space-y-6 max-w-xl z-10 text-left">
        {current.subtitle && (
          <span className="inline-block rounded-full bg-white/80 px-4 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase shadow-sm">
            {current.subtitle}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 leading-tight uppercase">
          {current.title}
        </h1>
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <button
            onClick={() => onBannerClick(current)}
            className="flex items-center gap-3 rounded-full bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold px-6 py-3.5 shadow-lg shadow-amber-100 transition-all group"
            style={{ color: current.ctaColor || '#000000' }}
          >
            <span>{current.ctaText || 'Shop Now'}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white group-hover:translate-x-1 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex justify-center md:justify-end z-10 w-full max-w-md md:max-w-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imageUrlDesktop}
          alt={current.title}
          className="hidden md:block w-full max-w-md md:max-w-lg object-contain rounded-2xl hover:scale-[1.02] transition-transform duration-300 max-h-[300px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imageUrlMobile || current.imageUrlDesktop}
          alt={current.title}
          className="block md:hidden w-full max-w-xs object-contain rounded-2xl max-h-[200px]"
        />
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 w-2 rounded-full transition-all ${currentIndex === idx ? 'bg-neutral-800 w-4' : 'bg-neutral-800/25'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/banners').then((r) => r.json()).catch(() => [])
    ]).then(([cats, prods, bList]) => {
      setCategories(cats);
      setProducts(prods);
      setBanners(bList);
      setLoading(false);

      // Record banner impressions
      if (Array.isArray(bList)) {
        bList.forEach((b) => {
          fetch(`/api/banners?id=${b.id}&action=view`, { method: 'POST' }).catch(() => { });
        });
      }
    }).catch((err) => {
      console.error("Failed to load dynamic storefront data:", err);
      setLoading(false);
    });
  }, []);

  const handleBannerClick = (b: any) => {
    // Record click
    fetch(`/api/banners?id=${b.id}&action=click`, { method: 'POST' }).catch(() => { });

    // Redirection
    const val = b.targetValue;
    if (b.targetType === 'product') {
      router.push(routes.product(val));
    } else if (b.targetType === 'category') {
      router.push(routes.category(val));
    } else if (b.targetType === 'search') {
      router.push(routes.search(val));
    } else if (b.targetType === 'url') {
      if (val.startsWith('http://') || val.startsWith('https://')) {
        window.open(val, '_blank');
      } else {
        router.push(val);
      }
    }
  };

  const heroBanners = useMemo(() => banners.filter((b) => b.type === 'hero'), [banners]);
  const promoBanners = useMemo(() => banners.filter((b) => b.type === 'promo'), [banners]);
  const seasonalBanners = useMemo(() => banners.filter((b) => b.type === 'seasonal' || b.type === 'mid_page'), [banners]);

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

  // Best Sellers (Style 1)
  const bestSellers = useMemo(() => {
    return products.filter((p) => p.rating >= 4.5).slice(0, 8);
  }, [products]);

  // Flash Sale products (Style 5)
  const flashSaleProducts = useMemo(() => {
    return products.filter((p) => p.mrp && p.mrp > p.price).slice(0, 6);
  }, [products]);

  // Fruits & Vegetables shelf (Style 4)
  const fruitsAndVeggies = useMemo(() => {
    return products.filter((p) => p.cat === 'fruits' || p.cat === 'veggies').slice(0, 8);
  }, [products]);

  // Dairy Products shelf (Style 4)
  const dairyProducts = useMemo(() => {
    return products.filter((p) => p.cat === 'dairy').slice(0, 8);
  }, [products]);

  // Snacks & Beverages shelf (Style 4)
  const snacksAndBeverages = useMemo(() => {
    return products.filter((p) => p.cat === 'snacks' || p.cat === 'beverages').slice(0, 8);
  }, [products]);

  // Recently Added products (Style 6)
  const recentlyAdded = useMemo(() => {
    return [...products].sort((a, b) => {
      const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return idB - idA;
    }).slice(0, 8);
  }, [products]);

  // Recommended products (Style 7)
  const recommendedProducts = useMemo(() => {
    return products.filter((p) => p.rating >= 4.4).slice(2, 10);
  }, [products]);

  // Frequently Bought (Style 1: dynamic simulation using ratings and presence in categories)
  const frequentlyBought = useMemo(() => {
    return products.filter((p) => p.rating >= 4.6).slice(0, 8);
  }, [products]);

  // Trending Near You (Style 3: simulated area-popularity)
  const trendingNear = useMemo(() => {
    return [...products].reverse().filter((p) => p.rating >= 4.3).slice(0, 8);
  }, [products]);

  // Daily Essentials (Everyday groceries)
  const dailyEssentials = useMemo(() => {
    return products.filter((p) => p.cat === 'dairy' || p.cat === 'fruits' || p.cat === 'veggies').slice(1, 9);
  }, [products]);

  // Top Rated (Style 2: Premium 5-star ratings or close)
  const topRated = useMemo(() => {
    return products.filter((p) => p.rating >= 4.8).slice(0, 8);
  }, [products]);

  // Budget Deals (Deepest discounts simulated by mrp - price diff)
  const budgetDeals = useMemo(() => {
    return products
      .filter((p) => p.mrp && p.mrp > p.price)
      .sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price))
      .slice(0, 8);
  }, [products]);

  // Under ₹99 (Affordable pricing)
  const under99 = useMemo(() => {
    return products.filter((p) => p.price < 99).slice(0, 8);
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
              </Link>
              <div className="text-sm text-neutral-600 font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>2400+ Fresh Products</span>
              </div>
            </div>
          </div>
          <div className='hidden sm:block'>
            <div className="relative flex-1 flex justify-center md:justify-end z-10 w-full max-w-md md:max-w-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/growexy_hero_delivery_guy.png"
                alt="Delivery Person holding vegetable basket"
                className="w-full !max-w-lg object-contain rounded-2xl hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC POPULAR CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16 text-center space-y-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase pb-4">
          Our Categories
        </h2>
        {loading ? (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar flex-nowrap">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="h-24 w-20 flex-shrink-0 rounded-2xl bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto no-scrollbar flex-nowrap justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={routes.category(cat.id)}
                className="flex flex-col items-center justify-center flex-shrink-0 w-20 group transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 hover:bg-emerald-50/50 hover:scale-105 active:scale-95 duration-200 ease-out transition-all select-none border border-neutral-100 shadow-sm">
                  {cat.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.iconUrl} alt={cat.name} className="h-12 w-12 object-contain" />
                  ) : (
                    <span className="text-neutral-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </span>
                  )}
                </div>
                <span className="mt-2 font-bold text-neutral-800 text-[11px] tracking-tight capitalize truncate w-full text-center group-hover:text-emerald-600 transition-colors leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* STYLE 1: COMPACT HORIZONTAL SCROLL - BEST SELLERS */}
      <section className="items-center flex flex-col">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 uppercase">
            Our Seasonal Offers
          </h2>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-nowrap">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-56 w-36 md:w-44 flex-shrink-0 rounded-2xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-nowrap scroll-smooth">
            {bestSellers.map((p) => (
              <ProductCardCompact key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* AutoScrolling Promotional Banner Carousel 1 */}
      {loading ? (
        <section className="mx-auto max-w-7xl px-6 py-4">
          <div className="h-[160px] sm:h-[180px] w-full rounded-[2rem] bg-neutral-100 animate-pulse" />
        </section>
      ) : (
        <AutoScrollingPromoCarousel
          banners={promoBanners.slice(0, 3)}
          fallbackList={[
            {
              bgColor: '#e0f4ff',
              title: 'EVERYDAY FRESH WITH ORGANICS FOODS',
              subtitle: 'Fresh Vegetables',
              imageUrl: '/growexy_organic_basket.png',
              ctaText: 'Grab Now'
            },
            {
              bgColor: '#f0fdf4',
              title: 'BEST DEALS OF THIS WEEK! SAVE 15% OFF',
              subtitle: 'Sales of the Month',
              imageUrl: '/growexy_fresh_fruits.png',
              ctaText: 'View Deals'
            },
            {
              bgColor: '#fffbeb',
              title: 'PREMIUM SNACKS AND CRISPS FOR HANGOUTS',
              subtitle: 'Hot Launches',
              imageUrl: '/growexy_almonds_bowl.png',
              ctaText: 'Explore'
            }
          ]}
          onBannerClick={handleBannerClick}
        />
      )}

      {/* STYLE 5: FLASH SALE SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-6 bg-rose-50/40 rounded-[2.5rem] border border-rose-100/50 my-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-sm text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            </span>
            <div className="text-left">
              <h2 className="text-lg md:text-xl font-black text-neutral-900 uppercase">Flash Sale</h2>
              <p className="text-[10px] md:text-xs font-semibold text-red-500">Super savings! Limited time offers only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500">Ends In:</span>
            <FlashSaleTimer />
          </div>
        </div>

        {/* Promo cards below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card Left: Best Deals */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-950 text-white p-8 md:p-12 flex flex-row items-center justify-between gap-4">
            <div className="space-y-3 max-w-[55%] text-left">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Sales of the month</span>
              <h4 className="text-xl md:text-2xl font-black uppercase leading-snug text-white!">BEST DEALS OF THIS WEEK!</h4>
              <span className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-xs px-3 py-1.5 shadow-sm shadow-amber-200">
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
              <span className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-xs px-3 py-1.5 shadow-sm shadow-amber-200">
                20% OFF
              </span>
            </div>
            <div className="w-[40%] flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/growexy_carrots_basket.png" alt="Carrots basket" className="w-full max-h-36 object-contain rounded-xl" />
            </div>
            <Link href={routes.category('dairy')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* DYNAMIC BEST SELLING PRODUCT */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-10 text-center">
        <div className="space-y-3 items-center flex flex-col">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase">
            Our Best Selling Product
          </h2>
          <p className="text-neutral-500 text-sm max-w-xl mx-auto text-center leading-relaxed">
            Discover our fresh organic selections, sourced directly from local eco-farms to provide the highest nutritional quality.
          </p>
        </div>

        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${activeTab === 'all'
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
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${activeTab === cat.id
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-80 rounded-3xl bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-neutral-500 py-10 font-medium">No products found in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* WEEKLY HOT DEALS */}
      <section className="mx-auto max-w-7xl px-6 py-4 space-y-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 text-center uppercase pb-4">
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* UNIQUE SECTION 4: Recently Added (Light Premium Layout) */}
      <section className="relative py-16 my-16 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 border-y border-purple-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-purple-200/50 pb-6 mb-10 gap-4">
            <div className="space-y-2 text-left">
              <span className="text-purple-600 font-black tracking-widest text-xs uppercase bg-purple-100/50 px-3 py-1 rounded-full border border-purple-200 inline-block mb-1">Hot Drops</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600">
                New Arrivals
              </h2>
              <p className="text-neutral-500 text-sm md:text-base font-bold">Be the first to try the latest additions to our shelves.</p>
            </div>
          </div>
          {loading ? (
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar flex-nowrap">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-80 w-64 flex-shrink-0 rounded-3xl bg-white/60 border border-purple-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : recentlyAdded.length === 0 ? null : (
            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar flex-nowrap scroll-smooth px-2">
              {recentlyAdded.map((p) => (
                <div key={p.id} className="w-[240px] flex-shrink-0 transition-transform duration-300 hover:-translate-y-2">
                  <ProductCard product={p} className="shadow-xl shadow-purple-900/5 border border-purple-100/50 bg-white/80 backdrop-blur-sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* UNIQUE SECTION 5 & 6: Recommended & Frequently Bought (Side by side comparison layout) */}
      <section className="mx-auto max-w-7xl px-6 py-10 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Recommended Block */}
          <div className="space-y-8 bg-neutral-50/50 p-6 md:p-8 rounded-[2.5rem] border border-neutral-100">
            <div className="flex items-center gap-3 border-b border-neutral-200/60 pb-4">
              <div className="h-10 w-10 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 uppercase">
                Recommended
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recommendedProducts.slice(0, 4).map((p) => (
                <ProductCardCompact key={p.id} product={p} />
              ))}
            </div>
          </div>
          {/* Frequently Bought Block */}
          <div className="space-y-8 bg-neutral-50/50 p-6 md:p-8 rounded-[2.5rem] border border-neutral-100">
            <div className="flex items-center gap-3 border-b border-neutral-200/60 pb-4">
              <div className="h-10 w-10 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 uppercase">
                Frequently Bought
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {frequentlyBought.slice(0, 4).map((p) => (
                <ProductCardCompact key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UNIQUE SECTION 8 & 11: Under 99 and Trending Near You (Bento Box style) */}
      <section className="mx-auto max-w-7xl px-6 py-10 my-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Trending Near You (Col span 7) */}
          <div className="md:col-span-7 bg-indigo-50 rounded-[2.5rem] p-6 md:p-10 flex flex-col border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <div>
                  <h2 className="text-2xl font-black text-indigo-950 uppercase">Trending Near You</h2>
                  <p className="text-indigo-800/70 text-xs font-bold uppercase tracking-wider">Local Favorites</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-nowrap scroll-smooth flex-1 items-center">
              {trendingNear.slice(0, 4).map((p) => (
                <ProductCardCompact key={p.id} product={p} />
              ))}
            </div>
          </div>

          {/* Under 99 (Col span 5) */}
          <div className="md:col-span-5 bg-teal-50 rounded-[2.5rem] p-6 md:p-10 flex flex-col border border-teal-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <div>
                <h2 className="text-2xl font-black text-teal-950 uppercase">Under ₹99</h2>
                <p className="text-teal-800/70 text-xs font-bold uppercase tracking-wider">Affordable Picks</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {under99.slice(0, 4).map((p) => (
                <ProductCardCompact key={p.id} product={p} />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* UNIQUE SECTION 7: Top Rated Premium (Gold Theme) */}
      <section className="mx-auto max-w-7xl px-6 py-16 my-16 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 rounded-br-[5rem] rounded-tl-[5rem] border-2 border-amber-200/50 shadow-inner relative">
        <div className="absolute top-0 right-10 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl"></div>
        <div className="text-center space-y-4 mb-12 relative z-10">
          <span className="inline-block px-5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-black uppercase rounded-full shadow-md shadow-amber-200 tracking-widest">Premium Choice</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 uppercase">
            Top Rated Products
          </h2>
          <p className="text-amber-800 font-medium">The highest quality items, chosen by our customers.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
          {topRated.map((p) => (
            <ProductCard key={p.id} product={p} className="border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-xl hover:shadow-amber-200/50" />
          ))}
        </div>
      </section>

      {/* UNIQUE SECTION 9: Daily Essentials (Offset/Staggered Grid) */}
      <section className="mx-auto max-w-7xl px-6 py-16 my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 uppercase">
            Daily Essentials
          </h2>
          <p className="text-neutral-500 font-medium mt-2">Everything you need for your day-to-day.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
          {dailyEssentials.slice(0, 8).map((p, idx) => (
            <div key={p.id} className={`transition-all duration-300 ${idx % 2 === 1 ? 'lg:translate-y-8' : ''}`}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* UNIQUE SECTION 10: Promo Banners */}
      <div className="my-16 lg:mt-24">
        <PromoBannerRow 
          banners={seasonalBanners} 
          fallbackList={[
            { bgColor: '#fff0f5', title: 'Fresh Berries Arrival', subtitle: 'Seasonal', imageUrl: '/growexy_fresh_fruits.png', ctaText: 'Shop Now' },
            { bgColor: '#e0f7fa', title: 'Summer Hydration', subtitle: 'Drinks', imageUrl: '/growexy_carrots_basket.png', ctaText: 'Refresh' },
            { bgColor: '#fff3e0', title: 'Morning Breakfast', subtitle: 'Bakery', imageUrl: '/growexy_almonds_bowl.png', ctaText: 'Grab Now' }
          ]} 
          onBannerClick={handleBannerClick} 
        />
      </div>

      {/* UNIQUE SECTION 12: Budget Deals (using ProductCardOffer) */}
      <section className="mx-auto max-w-7xl px-6 py-12 space-y-8 bg-rose-50/70 rounded-[3rem] border border-rose-100/80 my-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-white shadow-sm rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-red-950 uppercase">
                Budget Deals
              </h2>
              <p className="text-red-700 text-sm font-bold tracking-widest uppercase mt-1">Unbeatable prices</p>
            </div>
          </div>
          <Link href={routes.browse()} className="bg-white text-red-600 border border-red-200 font-black px-8 py-3.5 rounded-full hover:bg-red-50 transition-colors text-sm shadow-sm">
            View All Deals
          </Link>
        </div>
        
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-nowrap">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-64 w-40 flex-shrink-0 rounded-3xl bg-red-100/50 animate-pulse" />
            ))}
          </div>
        ) : budgetDeals.length === 0 ? null : (
          <div className="flex gap-6 overflow-x-auto pb-6 pt-4 no-scrollbar flex-nowrap scroll-smooth px-4">
            {budgetDeals.map((p) => (
              <ProductCardOffer key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* NEW SECTION 13: Features */}
      <section className="mx-auto max-w-7xl px-6 py-16 mb-6 bg-white border-t border-neutral-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <h3 className="font-extrabold text-neutral-900 uppercase text-sm">Free Delivery</h3>
            <p className="text-xs text-neutral-500 max-w-[200px]">Get free delivery on all orders above ₹500 within your local area.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            </div>
            <h3 className="font-extrabold text-neutral-900 uppercase text-sm">100% Organic</h3>
            <p className="text-xs text-neutral-500 max-w-[200px]">Certified organic produce sourced straight from local eco-farms.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h3 className="font-extrabold text-neutral-900 uppercase text-sm">Secure Payment</h3>
            <p className="text-xs text-neutral-500 max-w-[200px]">100% secure payment gateways for a seamless checkout experience.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </div>
            <h3 className="font-extrabold text-neutral-900 uppercase text-sm">Easy Returns</h3>
            <p className="text-xs text-neutral-500 max-w-[200px]">Not satisfied? Get an easy refund or replacement within 24 hours.</p>
          </div>
        </div>
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

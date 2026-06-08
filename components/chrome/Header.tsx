'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES as FALLBACK_CATEGORIES } from '@/lib/data';
import { routes } from '@/lib/routes';
import type { Category } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useServiceability } from '@/store/serviceability';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import Link from 'next/link';


/** Desktop header: logo, location, search, account/orders/cart, category bar. */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user, addresses, selectedAddr } = useAuth();
  const { cartCount } = useCart();
  const { pincode, serviceability, detect, locationName } = useServiceability();
  const activeAddr = addresses.find((a) => a.id === selectedAddr) || addresses[0];
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((cats: Category[]) => {
        if (cats.length) setCategories(cats);
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  useEffect(() => {
    if (!pincode && !activeAddr) {
      detect();
    }
  }, [pincode, activeAddr, detect]);

  const locationLabel = activeAddr?.label
    || (locationName && pincode
      ? `${locationName} (${pincode})`
      : locationName || pincode || 'Set location');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('our-categories-section');
      if (section) {
        setIsScrolled(section.getBoundingClientRect().bottom < 80);
      } else {
        setIsScrolled(window.scrollY > 150);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="hidden md:flex sticky top-0 z-50 bg-white/95 backdrop-blur-md flex-col">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 border-b border-neutral-100">
        {/* Logo & Location */}
        <div className="flex items-center gap-4">
          <Logo />

          {/* Location Selector (Auto-fetched & Manual) */}
          <div className='lg:block hidden '>
            <button
              onClick={() => router.push(routes.addresses())}
              className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50/60 px-3.5 py-1.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left max-w-[200px] sm:max-w-[240px] truncate"
            >
              <span className="text-emerald-600 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              </span>
              <div className="flex flex-col text-[10px] sm:text-xs">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight leading-none">Deliver to</span>
                <span className="font-extrabold text-neutral-800 truncate mt-0.5 max-w-[120px] sm:max-w-[150px] leading-tight">{locationLabel}</span>
              </div>
            </button>
          </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>
            </span>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
          </button>

          <Link href={routes.cart()} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
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
  );
}

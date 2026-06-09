'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useServiceability } from '@/store/serviceability';
import type { Category } from '@/lib/types';
import { CATEGORIES as FALLBACK_CATEGORIES } from '@/lib/data';
import { SearchBox } from './SearchBox';

/** Mobile sub-header (location + account + search) shown under the top app bar. */
export function MobileTop() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user, addresses, selectedAddr } = useAuth();

  const { pincode, detect, locationName } = useServiceability();
  const activeAddr = addresses.find((a) => a.id === selectedAddr) || addresses[0];

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((cats: Category[]) => {
        if (cats.length) setCategories(cats);
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (!pincode && !activeAddr) {
      detect();
    }
  }, [pincode, activeAddr, detect]);

  const locationLabel = activeAddr?.label 
    || (locationName && pincode 
        ? `${locationName} (${pincode})` 
        : locationName || pincode || 'Location');


  return (
    <div className="mtop flex flex-col p-0! bg-white">
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
        <div className="mtop-bar m-0!">
          <button className="mtop-loc" onClick={() => router.push(routes.addresses())}>
            <Icon name="pin" size={16} />
            <b>{locationLabel}</b>
            <Icon name="chevD" size={13} />
          </button>
          <Link
            href={user ? routes.account() : routes.auth()}
            className="flex h-9 items-center justify-center rounded-full bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            {user ? user.name.split(' ')[0] : 'Sign In'}
          </Link>
        </div>
        <div className="mtop-search">
          <SearchBox />
        </div>
      </div>

    </div>
  );
}

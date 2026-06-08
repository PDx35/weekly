'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

interface NavItem {
  href: string;
  icon: IconName;
  label: string;
}

/** Fixed bottom navigation for mobile. */
export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount, cartSubtotal } = useCart();
  const { user } = useAuth();

  const [shouldPulse, setShouldPulse] = useState(false);
  const prevCountRef = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 800);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  const items: NavItem[] = [
    { href: routes.home(), icon: 'home', label: 'Home' },
    { href: routes.browse(), icon: 'grid', label: 'Categories' },
    { href: routes.orders(), icon: 'receipt', label: 'Order Again' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const isProductPage = pathname.startsWith('/product/');

  const activeIndex = items.findIndex(it => isActive(it.href));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cartPulse {
          0% { transform: scale(1); }
          15% { transform: scale(1.08); }
          30% { transform: scale(0.95); }
          45% { transform: scale(1.03); }
          60% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        .animate-cart-pulse {
          animation: cartPulse 0.6s ease-in-out;
        }

        /* Unified Premium Floating Nav Bar */
        .mnav {
          display: flex !important;
          position: fixed !important;
          bottom: 16px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: calc(100% - 32px) !important;
          max-width: 360px !important;
          height: 64px !important;
          z-index: 100 !important;
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(24px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          box-shadow: 
            0 10px 30px -10px rgba(0, 0, 0, 0.12),
            0 1px 3px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          border-radius: 9999px !important;
          align-items: center !important;
          justify-content: space-around !important;
          padding: 6px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Responsive Breakpoints for Floating Bar */
        @media (min-width: 640px) {
          .mnav {
            bottom: 20px !important;
            max-width: 320px !important;
          }
        }
        @media (min-width: 1024px) {
          .mnav {
            bottom: 24px !important;
            max-width: 280px !important;
          }
        }

        /* Responsive Floating Cart Container */
        .floating-cart-container {
          position: fixed;
          bottom: 92px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 95;
          width: calc(100% - 32px);
          max-width: 360px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @media (min-width: 640px) {
          .floating-cart-container {
            bottom: 96px;
            max-width: 320px;
          }
        }
        @media (min-width: 1024px) {
          .floating-cart-container {
            bottom: 100px;
            max-width: 280px;
          }
        }

        /* Active Nav Item Custom Button */
        .mnav-i-custom {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 4px 0;
          background: none;
          border: none;
          outline: none;
          color: #71717a; /* text-zinc-500 */
          font-size: 11px;
          font-weight: 600;
          transition: color 0.3s ease;
          flex: 1;
        }
        .mnav-i-custom.active {
          color: #047857; /* text-emerald-700 */
          font-weight: 700;
        }
      `}} />

      {/* Floating Dynamic Cart Button */}
      <div 
        className={`floating-cart-container ${
          cartCount > 0 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
        style={isProductPage ? { bottom: '24px' } : undefined}
      >
        <button
          onClick={() => router.push(routes.cart())}
          className={`flex w-full items-center justify-between rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-5 py-3.5 text-white font-bold transition-all hover:brightness-105 active:scale-98 shadow-lg shadow-emerald-600/35 border border-emerald-500/30 ${
            shouldPulse ? 'animate-cart-pulse' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold leading-none opacity-90">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              <span className="text-sm font-extrabold mt-0.5">₹{cartSubtotal}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/15 px-3.5 py-1.5 rounded-full hover:bg-white/20 transition-colors">
            <span>View Cart</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>
      </div>

      {/* Glassmorphic Floating Navigation Dock */}
      {!isProductPage && (
        <nav className="mnav">
          {/* Animated Sliding Background Indicator */}
          {activeIndex !== -1 && (
            <div 
              className="absolute top-[6px] bottom-[6px] rounded-full bg-emerald-600/10 border border-emerald-600/5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
              style={{
                width: 'calc((100% - 12px) / 3)',
                left: '6px',
                transform: `translateX(calc(${activeIndex} * 100%))`,
              }}
            />
          )}

          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <button
                key={it.label}
                className={`mnav-i-custom ${active ? 'active' : ''}`}
                onClick={() => router.push(it.href)}
                style={{ zIndex: 10 }}
              >
                <Icon
                  name={it.icon}
                  size={22}
                  className={`transition-transform duration-300 ${active ? 'scale-110 text-emerald-700' : 'scale-100 text-zinc-500'}`}
                />
                <span className="mt-1 text-[10px] tracking-tight">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}

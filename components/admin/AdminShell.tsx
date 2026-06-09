'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { AdminGuard } from './AdminGuard';
import { Logo } from '@/components/chrome/Logo';
import { routes } from '@/lib/routes';

import {
  LayoutDashboard,
  Package,
  Tags,
  Image as ImageIcon,
  ShoppingCart,
  Ticket,
  Store,
  LifeBuoy,
  LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/market', label: 'Weekly market', icon: Store },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
];

/** Admin chrome: sidebar + topbar, gated by {@link AdminGuard}. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const logout = async () => {
    await signOut();
    router.replace('/admin/login');
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 text-neutral-900">
        {/* Modern Dark Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-slate-300 md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => router.push(routes.home())}>
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20">
                <Store size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">fresh<span className="text-emerald-400">mart</span></span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1.5 px-4 py-6 overflow-y-auto">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-emerald-500/20'
                      : 'hover:bg-white/5 hover:text-white',
                  )}
                >
                  <item.icon size={18} className={cn('transition-colors', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
                  {item.label}
                  {active && (
                    <div className="ml-auto size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white ring-1 ring-white/10">
                {user?.email?.[0].toUpperCase() ?? 'A'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-medium text-white">{user?.email}</span>
                <span className="text-[10px] text-slate-500">Administrator</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between border-b border-neutral-200/60 bg-white/80 backdrop-blur-md px-4 py-3 md:hidden sticky top-0 z-30">
            <span className="font-bold tracking-tight text-neutral-900">
              fresh<span className="text-emerald-600">mart</span>
            </span>
            <button onClick={logout} className="text-sm font-semibold text-neutral-500 hover:text-red-600">
              Sign out
            </button>
          </header>
          {/* Mobile nav */}
          <nav className="flex gap-2 overflow-x-auto border-b border-neutral-200/60 bg-white/80 backdrop-blur-md px-3 py-2 md:hidden sticky top-[53px] z-20 no-scrollbar">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all shadow-sm',
                    active
                      ? 'bg-slate-900 text-white ring-1 ring-slate-900'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 ring-1 ring-neutral-200',
                  )}
                >
                  <item.icon size={14} className={active ? 'text-emerald-400' : 'text-neutral-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-5 md:p-10">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

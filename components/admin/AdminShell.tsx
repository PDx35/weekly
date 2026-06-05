'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { AdminGuard } from './AdminGuard';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/market', label: 'Weekly market' },
  { href: '/admin/support', label: 'Support' },
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
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
          <div className="px-5 py-4 text-lg font-bold">
            fresh<span className="text-emerald-600">mart</span>
            <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Admin
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-neutral-600 hover:bg-neutral-100',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500">
            <div className="truncate">{user?.email}</div>
            <button onClick={logout} className="mt-1 font-semibold text-red-600 hover:underline">
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
            <span className="font-bold">
              fresh<span className="text-emerald-600">mart</span> Admin
            </span>
            <button onClick={logout} className="text-sm font-semibold text-red-600">
              Sign out
            </button>
          </header>
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                  isActive(item.href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-neutral-600 hover:bg-neutral-100',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

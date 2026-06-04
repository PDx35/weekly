'use client';

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
  const { user } = useAuth();
  const { cartCount } = useCart();

  const items: NavItem[] = [
    { href: routes.home(), icon: 'home', label: 'Home' },
    { href: routes.browse(), icon: 'grid', label: 'Categories' },
    { href: routes.orders(), icon: 'receipt', label: 'Orders' },
    { href: user ? routes.account() : routes.auth(), icon: 'user', label: 'Account' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="mnav">
      {items.map((it) => (
        <button
          key={it.label}
          className={`mnav-i ${isActive(it.href) ? 'on' : ''}`}
          onClick={() => router.push(it.href)}
        >
          <Icon name={it.icon} size={22} />
          <span>{it.label}</span>
        </button>
      ))}
      <button
        className={`mnav-i mnav-cart ${isActive(routes.cart()) ? 'on' : ''}`}
        onClick={() => router.push(routes.cart())}
      >
        <div className="mnav-cart-ico">
          <Icon name="cart" size={22} />
          {cartCount > 0 && <i>{cartCount}</i>}
        </div>
        <span>Cart</span>
      </button>
    </nav>
  );
}

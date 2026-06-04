'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/lib/data';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';

/** Desktop header: logo, location, search, account/orders/cart, category bar. */
export function Header() {
  const router = useRouter();
  const { user, addresses, selectedAddr } = useAuth();
  const { cartCount } = useCart();
  const activeAddr = addresses.find((a) => a.id === selectedAddr) || addresses[0];

  return (
    <header className="hdr">
      <div className="hdr-inner">
        <Logo onClick={() => router.push(routes.home())} />

        <button className="hdr-loc" onClick={() => router.push(routes.addresses())}>
          <Icon name="pin" size={17} />
          <span>
            <i>Deliver in 30 min to</i>
            <b>
              {activeAddr?.label || 'Set location'} <Icon name="chevD" size={13} />
            </b>
          </span>
        </button>

        <div className="hdr-search">
          <SearchBox />
        </div>

        <nav className="hdr-nav">
          <button className="hdr-link" onClick={() => router.push(routes.orders())}>
            <Icon name="receipt" size={20} />
            <span>Orders</span>
          </button>
          <button
            className="hdr-link"
            onClick={() => router.push(user ? routes.account() : routes.auth())}
          >
            <Icon name="user" size={20} />
            <span>{user ? user.name.split(' ')[0] : 'Login'}</span>
          </button>
          <button className="hdr-cart" onClick={() => router.push(routes.cart())}>
            <Icon name="cart" size={20} />
            <span>Cart</span>
            {cartCount > 0 && <i className="cart-badge">{cartCount}</i>}
          </button>
        </nav>
      </div>

      {/* Category strip (desktop) */}
      <div className="catbar">
        <div className="catbar-inner">
          <button className="catbar-all" onClick={() => router.push(routes.browse())}>
            <Icon name="grid" size={16} /> All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className="catbar-item"
              onClick={() => router.push(routes.category(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

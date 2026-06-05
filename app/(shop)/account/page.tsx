'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

function initialsOf(name: string, email: string): string {
  const base = name.trim() || email.trim() || 'U';
  return base
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AccountContent() {
  const router = useRouter();
  const { user, addresses, signOut } = useAuth();
  const { cartCount, showToast } = useCart();
  if (!user) return null;

  const tiles: { icon: IconName; t: string; d: string; href: string }[] = [
    { icon: 'receipt', t: 'My orders', d: 'Track & reorder', href: routes.orders() },
    { icon: 'pin', t: 'Saved addresses', d: `${addresses.length} saved`, href: routes.addresses() },
    { icon: 'cart', t: 'Your cart', d: `${cartCount} items`, href: routes.cart() },
    { icon: 'phone', t: 'Help & support', d: 'We’re here 24×7', href: routes.support() },
  ];

  const logout = async () => {
    await signOut();
    showToast('Logged out');
    router.push(routes.auth());
  };

  return (
    <div className="page account">
      <h1 className="page-title">My account</h1>
      <div className="acct-head">
        <div className="acct-avatar">{initialsOf(user.name, user.email)}</div>
        <div className="acct-id">
          <b>{user.name || 'FreshMart shopper'}</b>
          <span>{user.email}</span>
          <span>{user.phone}</span>
        </div>
        <Button
          variant="ghost"
          icon="edit"
          onClick={() => showToast('Profile editing is coming soon')}
        >
          Edit profile
        </Button>
      </div>
      <div className="acct-tiles">
        {tiles.map((t) => (
          <button key={t.t} className="acct-tile" onClick={() => router.push(t.href)}>
            <span className="acct-tile-ico">
              <Icon name={t.icon} size={22} />
            </span>
            <div>
              <b>{t.t}</b>
              <i>{t.d}</i>
            </div>
            <Icon name="chevR" size={18} className="acct-tile-arrow" />
          </button>
        ))}
      </div>
      <button className="acct-logout" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}

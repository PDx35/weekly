import { Footer } from '@/components/chrome/Footer';
import { Header } from '@/components/chrome/Header';
import { MobileNav } from '@/components/chrome/MobileNav';
import { MobileTop } from '@/components/chrome/MobileTop';

/**
 * Shop shell: the app chrome wrapping all customer-facing pages. Mirrors the
 * prototype `Shell` (header + mobile top bar + main + footer + bottom nav).
 * The `/auth` route lives outside this group and renders chrome-free.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Header />
      <MobileTop />
      <main className="main">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}

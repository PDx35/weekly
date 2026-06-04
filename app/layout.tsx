import type { Metadata } from 'next';
import './globals.css';
import { Toast } from '@/components/ui/Toast';
import { AuthProvider } from '@/store/auth';
import { CartProvider } from '@/store/cart';

export const metadata: Metadata = {
  title: {
    default: 'FreshMart — Farm-fresh groceries in 30 minutes',
    template: '%s · FreshMart',
  },
  description:
    'FreshMart delivers farm-fresh fruits, vegetables, dairy, and daily essentials to your door in 30 minutes.',
};

/**
 * Root layout: HTML shell, fonts, and global providers.
 *
 * The chrome (header/footer/nav) lives in the `(shop)` route group layout so the
 * full-screen `/auth` route can opt out of it. Providers and the global `Toast`
 * wrap everything, including `/auth`.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Design-system fonts, matching the prototype (loaded via link so the
            literal family names in globals.css resolve unchanged). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Loaded as a global stylesheet link (not next/font) so the literal
            family names in the verbatim globals.css resolve unchanged. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesque:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

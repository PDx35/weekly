'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { Logo } from './Logo';
import Link from 'next/link';


const COLUMNS = [
  {
    h: 'Shop',
    links: ['Fresh Fruits', 'Vegetables', 'Dairy & Eggs', 'Bakery', 'Staples & Grains'],
  },
  {
    h: 'Company',
    links: ['About FreshMart', 'Careers', 'FreshMart for Business', 'Press', 'Blog'],
  },
  {
    h: 'Support',
    links: [
      'Help Centre',
      'Track your order',
      'Returns & refunds',
      'Contact us',
      'Report an issue',
    ],
  },
] as const;

/** Map a footer link label to a real route, mirroring the prototype. */
function linkTarget(label: string): string {
  if (label === 'Contact us' || label === 'Help Centre' || label === 'Report an issue') {
    return routes.support();
  }
  if (label === 'Track your order') return routes.orders();
  return routes.browse();
}

/** Site footer with brand blurb, link columns, and legal strip. */
export function Footer() {
  const router = useRouter();
  return (
    <footer className="mx-auto max-w-7xl px-6 pt-16 mt-16 border-t border-neutral-100 text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Logo />
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              Weekly Market is your premier local green grocer, providing farm-fresh produce, natural dairy, and raw organics delivered directly to your doorstep.
            </p>
          </div>

          {/* About Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800 pb-4">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href="#" className="hover:text-emerald-600">About Us</Link></li>
              <li><Link href={routes.browse()} className="hover:text-emerald-600">Shop Catalog</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Our Brands</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Partner Program</Link></li>
            </ul>
          </div>

          {/* Help Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800 pb-4">Support</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li><Link href={routes.support()} className="hover:text-emerald-600">Help Center</Link></li>
              <li><Link href={routes.addresses()} className="hover:text-emerald-600">Delivery Areas</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-600">Terms of Use</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Contact Us</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Have questions? Reach out at:
              <br />
              <strong className="text-neutral-800">support@weeklymarket.in</strong>
            </p>
            <div className="flex gap-2 mt-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-emerald-600 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-emerald-600 hover:text-white transition-colors"
                aria-label="Twitter (X)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-emerald-600 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Growexy. All rights reserved.
        </div>
      </footer>
  );
}

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
              Growexy is your premier local green grocer, providing farm-fresh produce, natural dairy, and raw organics delivered directly to your doorstep.
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
              <strong className="text-neutral-800">support@growexy.com</strong>
            </p>
            <div className="flex gap-2">
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                F
              </span>
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                T
              </span>
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors">
                I
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Growexy. All rights reserved.
        </div>
      </footer>
  );
}

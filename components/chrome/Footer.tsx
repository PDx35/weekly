'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { Logo } from './Logo';

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
    <footer className="ftr">
      <div className="ftr-inner">
        <div className="ftr-brand">
          <Logo onClick={() => router.push(routes.home())} />
          <p>
            Farm-fresh groceries delivered to your door in 30 minutes. Handpicked quality, honest
            prices.
          </p>
          <div className="ftr-badges">
            <span>
              <Icon name="truck" size={15} /> 30-min delivery
            </span>
            <span>
              <Icon name="shield" size={15} /> 100% quality promise
            </span>
          </div>
        </div>
        <div className="ftr-cols">
          {COLUMNS.map((col) => (
            <div key={col.h} className="ftr-col">
              <h4>{col.h}</h4>
              {col.links.map((l) => (
                <button key={l} onClick={() => router.push(linkTarget(l))}>
                  {l}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="ftr-bottom">
        <span>© 2026 FreshMart Retail Pvt. Ltd.</span>
        <span className="ftr-legal">
          <button>Terms</button>
          <button>Privacy</button>
          <button>FSSAI Lic. 100xxxxxxxx1234</button>
        </span>
      </div>
    </footer>
  );
}

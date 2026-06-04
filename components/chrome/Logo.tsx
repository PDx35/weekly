'use client';

import { Icon } from '@/components/ui/Icon';

/** FreshMart wordmark. `onClick` typically navigates home. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="FreshMart home">
      <span className="logo-mark">
        <Icon name="leaf" size={19} stroke={1.9} />
      </span>
      <span className="logo-text">
        fresh<b>mart</b>
      </span>
    </button>
  );
}

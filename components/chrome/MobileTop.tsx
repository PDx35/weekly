'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useServiceability } from '@/store/serviceability';
import { SearchBox } from './SearchBox';

/** Mobile sub-header (location + account + search) shown under the top app bar. */
export function MobileTop() {
  const router = useRouter();
  const { user, addresses, selectedAddr } = useAuth();
  const { pincode, serviceability, detect, locationName } = useServiceability();
  const activeAddr = addresses.find((a) => a.id === selectedAddr) || addresses[0];

  useEffect(() => {
    if (!pincode && !activeAddr) {
      detect();
    }
  }, [pincode, activeAddr, detect]);

  const locationLabel = activeAddr?.label 
    || (locationName && pincode 
        ? `${locationName} (${pincode})` 
        : locationName || pincode || 'Location');

  return (
    <div className="mtop">
      <div className="mtop-bar">
        <button className="mtop-loc" onClick={() => router.push(routes.addresses())}>
          <Icon name="pin" size={16} />
          <b>{locationLabel}</b>
          <Icon name="chevD" size={13} />
        </button>
        <button
          className="mtop-user"
          onClick={() => router.push(user ? routes.account() : routes.auth())}
        >
          <Icon name="user" size={20} />
        </button>
      </div>
      <div className="mtop-search">
        <SearchBox />
      </div>
    </div>
  );
}

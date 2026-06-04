'use client';

import { useCart } from '@/store/cart';
import { Icon } from './Icon';

/** Global toast, driven by the cart context's `toast` state. */
export function Toast() {
  const { toast } = useCart();
  return (
    <div className={`toast ${toast ? 'toast-on' : ''}`}>
      {toast && (
        <>
          <Icon name="check" size={16} /> {toast}
        </>
      )}
    </div>
  );
}

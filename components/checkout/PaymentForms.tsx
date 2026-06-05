'use client';

import { Field } from '@/components/ui/Field';
import { Icon, type IconName } from '@/components/ui/Icon';

/** A selectable payment method. `id` is sent to the server at checkout. */
export interface PaymentMethod {
  id: 'upi' | 'card' | 'wallet' | 'netbank' | 'cod';
  icon: IconName;
  label: string;
  sub: string;
}

export const PAYMENTS: PaymentMethod[] = [
  { id: 'upi', icon: 'bolt', label: 'UPI', sub: 'GPay, PhonePe, Paytm & more' },
  { id: 'card', icon: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'wallet', icon: 'wallet', label: 'Wallets', sub: 'Paytm, Amazon Pay, Mobikwik' },
  { id: 'netbank', icon: 'bank', label: 'Net Banking', sub: 'All major banks' },
  { id: 'cod', icon: 'cash', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
];

/**
 * Per-method input forms. These are UI only in Sprint 3 — online methods are
 * stubbed until Razorpay arrives in Sprint 4; COD is the working path.
 */
export function PaymentForms({ method }: { method: PaymentMethod['id'] }) {
  if (method === 'upi') {
    return (
      <div className="pay-detail">
        <div className="pay-apps">
          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((a) => (
            <button key={a} type="button" className="pay-app">
              {a}
            </button>
          ))}
        </div>
        <Field label="Or enter UPI ID" placeholder="yourname@okhdfc" />
      </div>
    );
  }
  if (method === 'card') {
    return (
      <div className="pay-detail field-grid">
        <Field label="Card number" placeholder="1234 5678 9012 3456" wide />
        <Field label="Expiry" placeholder="MM/YY" />
        <Field label="CVV" placeholder="•••" />
        <Field label="Name on card" wide />
      </div>
    );
  }
  if (method === 'wallet') {
    return (
      <div className="pay-detail pay-apps">
        {['Paytm', 'Amazon Pay', 'Mobikwik', 'Freecharge'].map((a) => (
          <button key={a} type="button" className="pay-app">
            {a}
          </button>
        ))}
      </div>
    );
  }
  if (method === 'netbank') {
    return (
      <div className="pay-detail">
        <div className="pay-apps">
          {['HDFC', 'ICICI', 'SBI', 'Axis'].map((a) => (
            <button key={a} type="button" className="pay-app">
              {a}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Other banks</span>
          <select>
            <option>Choose your bank</option>
            <option>Kotak Mahindra</option>
            <option>Bank of Baroda</option>
            <option>Punjab National Bank</option>
          </select>
        </label>
      </div>
    );
  }
  return (
    <div className="pay-detail pay-cod">
      <Icon name="cash" size={20} /> Pay in cash or via UPI when your order arrives. Please keep
      exact change handy.
    </div>
  );
}

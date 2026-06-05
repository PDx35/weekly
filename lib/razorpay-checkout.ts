/**
 * Client-side Razorpay Checkout loader + types.
 *
 * Lazily injects the Razorpay Checkout script and returns the global
 * constructor. The actual payment is opened from the checkout page; success is
 * always re-verified server-side before an order is marked paid.
 */
export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  /** Amount in paise. */
  amount: number;
  currency: string;
  name: string;
  description?: string;
  /** Razorpay order id from the server. */
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  var Razorpay: RazorpayConstructor | undefined;
}

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader: Promise<RazorpayConstructor> | null = null;

/** Load (once) and resolve the Razorpay Checkout constructor. */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay Checkout is only available in the browser.'));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;
  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.onload = () =>
      window.Razorpay
        ? resolve(window.Razorpay)
        : reject(new Error('Razorpay failed to initialise.'));
    script.onerror = () => {
      loader = null;
      reject(new Error('Razorpay failed to load.'));
    };
    document.body.appendChild(script);
  });
  return loader;
}

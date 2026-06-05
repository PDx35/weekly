'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressCard } from '@/components/account/AddressCard';
import { AddressForm, type AddressDraft } from '@/components/account/AddressForm';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { BillRows } from '@/components/cart/BillRows';
import { PAYMENTS, PaymentForms, type PaymentMethod } from '@/components/checkout/PaymentForms';
import { Button } from '@/components/ui/Button';
import { Crumbs } from '@/components/ui/Crumbs';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { rupee } from '@/components/ui/Price';
import { computeBill } from '@/lib/bill';
import { auth } from '@/lib/firebase/client';
import { loadRazorpay, type RazorpaySuccess } from '@/lib/razorpay-checkout';
import { routes } from '@/lib/routes';
import type { Address } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

const STEPS = ['Address', 'Payment', 'Review'];
const SLOTS = ['Within 30 minutes', 'Today, 5–7 PM', 'Today, 7–9 PM', 'Tomorrow, 8–10 AM'];

interface CreateOrderResponse {
  orderId?: string;
  online?: boolean;
  razorpayOrderId?: string;
  amount?: number;
  keyId?: string;
  freshmartOrderId?: string;
  error?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const { user, addresses, selectedAddr, setSelectedAddr, upsertAddress } = useAuth();
  const { cartItems, cartCount, cartSubtotal, clearCart, showToast } = useCart();

  const [step, setStep] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [method, setMethod] = useState<PaymentMethod['id']>('cod');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [placing, setPlacing] = useState(false);
  const placed = useRef(false);

  const bill = computeBill(cartSubtotal, 0);
  const addr = addresses.find((a) => a.id === selectedAddr) ?? addresses[0];
  const payMeta = PAYMENTS.find((p) => p.id === method)!;

  // Bounce to home if the cart empties (but not right after placing an order).
  useEffect(() => {
    if (!placed.current && cartItems.length === 0) router.replace(routes.home());
  }, [cartItems.length, router]);

  if (cartItems.length === 0) return null;

  const saveAddress = async (draft: AddressDraft) => {
    await upsertAddress(editing ? { ...editing, ...draft } : { ...draft, id: '', def: false });
    showToast('Address saved');
    setAdding(false);
    setEditing(null);
  };

  const goToConfirm = (orderId: string) => {
    placed.current = true;
    clearCart();
    router.push(routes.confirm(orderId));
  };

  /** Open Razorpay Checkout, then verify the payment server-side. */
  const payOnline = async (data: CreateOrderResponse, token: string) => {
    const Razorpay = await loadRazorpay();
    const rzp = new Razorpay({
      key: data.keyId!,
      amount: (data.amount ?? 0) * 100,
      currency: 'INR',
      name: 'FreshMart',
      description: `Order ${data.freshmartOrderId}`,
      order_id: data.razorpayOrderId!,
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      theme: { color: '#2C8C5A' },
      handler: async (resp: RazorpaySuccess) => {
        try {
          const vres = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...resp, freshmartOrderId: data.freshmartOrderId }),
          });
          const vdata = (await vres.json()) as { orderId?: string; error?: string };
          if (vres.ok && vdata.orderId) {
            showToast('Payment successful!');
            goToConfirm(vdata.orderId);
          } else {
            showToast(vdata.error ?? 'Payment verification failed');
            setPlacing(false);
          }
        } catch {
          showToast('Could not verify payment. Check your orders shortly.');
          setPlacing(false);
        }
      },
      modal: {
        ondismiss: () => {
          showToast('Payment cancelled — your order is saved as pending');
          setPlacing(false);
        },
      },
    });
    rzp.open();
  };

  const place = async () => {
    if (!addr) {
      showToast('Add a delivery address first');
      return;
    }
    setPlacing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        showToast('Please sign in again');
        setPlacing(false);
        return;
      }
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems.map(({ product, qty }) => ({ id: product.id, qty })),
          addressId: addr.id,
          slot,
          method,
          clientTotal: bill.grand,
        }),
      });
      const data = (await res.json()) as CreateOrderResponse;
      if (!res.ok) {
        showToast(data.error ?? 'Could not place order');
        setPlacing(false);
        return;
      }
      if (data.online) {
        await payOnline(data, token);
        return;
      }
      showToast('Order placed!');
      goToConfirm(data.orderId!);
    } catch {
      showToast('Network error. Please try again.');
      setPlacing(false);
    }
  };

  return (
    <div className="page checkout">
      <Crumbs items={[{ label: 'Cart', href: routes.cart() }, { label: 'Checkout' }]} />
      <div className="steps">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => i < step && setStep(i)}
          >
            <span className="step-n">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="checkout-grid">
        <div className="checkout-main">
          {step === 0 && (
            <div className="co-block">
              <h2>Delivery address</h2>
              <div className="addr-list">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    a={a}
                    selected={selectedAddr === a.id}
                    onSelect={() => void setSelectedAddr(a.id)}
                    onEdit={() => {
                      setEditing(a);
                      setAdding(true);
                    }}
                  />
                ))}
              </div>
              {adding ? (
                <AddressForm
                  initial={editing}
                  onCancel={() => {
                    setAdding(false);
                    setEditing(null);
                  }}
                  onSave={saveAddress}
                />
              ) : (
                <button
                  className="addr-add"
                  onClick={() => {
                    setEditing(null);
                    setAdding(true);
                  }}
                >
                  <Icon name="plusCircle" size={18} /> Add a new address
                </button>
              )}

              <h2 style={{ marginTop: 22 }}>Delivery slot</h2>
              <div className="addr-types">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    className={`chip ${slot === s ? 'chip-on' : ''}`}
                    onClick={() => setSlot(s)}
                  >
                    <Icon name="clock" size={14} /> {s}
                  </button>
                ))}
              </div>

              <div className="co-actions">
                <Button size="lg" iconRight="arrowR" disabled={!addr} onClick={() => setStep(1)}>
                  Deliver here
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="co-block">
              <h2>Payment method</h2>
              <div className="pay-list">
                {PAYMENTS.map((p) => (
                  <div key={p.id} className={`pay-opt ${method === p.id ? 'on' : ''}`}>
                    <button className="pay-head" onClick={() => setMethod(p.id)}>
                      <span className="addr-radio">
                        {method === p.id && <Icon name="check" size={14} />}
                      </span>
                      <span className="pay-ico">
                        <Icon name={p.icon} size={20} />
                      </span>
                      <span className="pay-text">
                        <b>{p.label}</b>
                        <i>{p.sub}</i>
                      </span>
                      {p.id === 'cod' && <span className="pay-tag">No charges</span>}
                    </button>
                    {method === p.id && <PaymentForms method={p.id} />}
                  </div>
                ))}
              </div>
              <div className="co-actions">
                <Button variant="ghost" onClick={() => setStep(0)} icon="back">
                  Back
                </Button>
                <Button size="lg" iconRight="arrowR" onClick={() => setStep(2)}>
                  Review order
                </Button>
              </div>
            </div>
          )}

          {step === 2 && addr && (
            <div className="co-block">
              <h2>Review &amp; place order</h2>
              <div className="review-sec">
                <div className="review-head">
                  <Icon name="pin" size={16} /> Delivering to <b>{addr.label}</b>
                  <button onClick={() => setStep(0)}>Change</button>
                </div>
                <p className="review-addr">
                  {addr.name} · {addr.phone}
                  <br />
                  {addr.line1}, {addr.line2}, {addr.city} – {addr.pin}
                </p>
                <p className="review-addr">
                  <Icon name="clock" size={14} /> {slot}
                </p>
              </div>
              <div className="review-sec">
                <div className="review-head">
                  <Icon name={payMeta.icon} size={16} /> Paying via <b>{payMeta.label}</b>
                  <button onClick={() => setStep(1)}>Change</button>
                </div>
              </div>
              <div className="review-sec">
                <div className="review-head">
                  <Icon name="pkg" size={16} /> {cartCount} items
                </div>
                <div className="review-items">
                  {cartItems.map(({ product, qty }) => (
                    <div key={product.id} className="review-item">
                      <Img product={product} ratio="1 / 1" radius="8px" className="review-thumb" />
                      <span>
                        {product.name} <i>× {qty}</i>
                      </span>
                      <b>{rupee(product.price * qty)}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="co-actions">
                <Button variant="ghost" onClick={() => setStep(1)} icon="back">
                  Back
                </Button>
                <Button size="lg" disabled={placing} onClick={place}>
                  {placing
                    ? 'Placing order…'
                    : method === 'cod'
                      ? `Place order · ${rupee(bill.grand)}`
                      : `Pay ${rupee(bill.grand)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Order summary</h3>
            <div className="summary-eta">
              <Icon name="clock" size={16} /> Arriving in ~30 min
            </div>
            <BillRows bill={bill} />
            <p className="safe-note">
              <Icon name="shield" size={14} /> 256-bit secure checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

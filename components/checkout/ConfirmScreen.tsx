'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { BillRows } from '@/components/cart/BillRows';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { rupee } from '@/components/ui/Price';
import { catOf, find } from '@/lib/data';
import { db } from '@/lib/firebase/client';
import { stageFromStatus } from '@/lib/orders';
import { routes } from '@/lib/routes';
import type { Order, Product } from '@/lib/types';
import { useAuth } from '@/store/auth';

const TRACK_STAGES: { k: string; icon: IconName; t: string; d: string }[] = [
  { k: 'confirmed', icon: 'check', t: 'Order confirmed', d: 'We’ve received your order' },
  { k: 'packed', icon: 'pkg', t: 'Packed', d: 'Items picked & quality-checked' },
  { k: 'out', icon: 'truck', t: 'Out for delivery', d: 'Rider is on the way' },
  { k: 'delivered', icon: 'home', t: 'Delivered', d: 'Enjoy your fresh groceries!' },
];

/** Order confirmation + animated tracking. Reads the order from Firestore. */
export function ConfirmScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [snap, prodSnap] = await Promise.all([
          getDoc(doc(db, 'orders', orderId)),
          getDocs(collection(db, 'products')),
        ]);
        if (!active) return;
        
        const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
        setLiveProducts(products);

        if (snap.exists()) {
          setOrder(snap.data() as Order);
          setStatus('ready');
        } else {
          setStatus('missing');
        }
      } catch {
        if (active) setStatus('missing');
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (status === 'loading') {
    return (
      <div className="page confirm">
        <Empty icon="receipt" title="Loading your order…" />
      </div>
    );
  }

  if (status === 'missing' || !order) {
    return (
      <div className="page confirm">
        <Empty
          icon="receipt"
          title="Order not found"
          sub="We couldn’t load this order. It may still be processing."
        >
          <Button iconRight="arrowR" onClick={() => router.push(routes.orders())}>
            View your orders
          </Button>
        </Empty>
      </div>
    );
  }

  const stage = stageFromStatus(order.status);

  return (
    <div className="page confirm">
      <div className="confirm-hero">
        <div className="confirm-check">
          <Icon name="check" size={34} stroke={2.4} />
        </div>
        <h1>Order placed!</h1>
        <p>
          Thank you, {user ? user.name.split(' ')[0] || 'there' : 'there'}. Your order{' '}
          <b>#{order.id}</b> is confirmed.
        </p>
        <div className="confirm-eta">
          <Icon name="clock" size={18} /> Arriving in <b>~{order.eta} minutes</b>
        </div>
      </div>

      <div className="track-card">
        <h2>Track your order</h2>
        <div className="track">
          {TRACK_STAGES.map((st, i) => (
            <div
              key={st.k}
              className={`track-step ${i <= stage ? 'done' : ''} ${i === stage ? 'cur' : ''}`}
            >
              <div className="track-ico">
                <Icon name={i <= stage ? st.icon : 'clock'} size={18} />
              </div>
              <div className="track-meta">
                <b>{st.t}</b>
                <i>{st.d}</i>
              </div>
              {i === stage && i < 3 && <span className="track-live">In progress</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-grid confirm-grid">
        <div className="checkout-main">
          <div className="co-block">
            <h2>Order details</h2>
            <div className="review-items">
              {order.items.map((it) => {
                let product = find(it.productId);
                
                if (!product && liveProducts.length > 0) {
                  product = liveProducts.find((p) => p.id === it.productId);
                  if (!product) {
                    const parent = liveProducts.find((p) =>
                      (p as Product & { variants?: { id: string }[] }).variants?.some((v) => v.id === it.productId)
                    );
                    if (parent) product = parent;
                  }
                }

                return (
                  <div key={it.productId} className="review-item">
                    <Img
                      product={product}
                      src={it.imageUrl || product?.images?.[0]}
                      cat={product ? catOf(product?.cat) : undefined}
                      ratio="1 / 1"
                      radius="8px"
                      className="review-thumb"
                      label={it.name}
                    />
                    <span>
                      {it.name} <i>× {it.qty}</i>
                    </span>
                    <b>{rupee(it.price * it.qty)}</b>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="checkout-side">
          <div className="summary-card">
            <h3>Bill</h3>
            <BillRows bill={order.totals} />
            <div className="confirm-pay">
              <Icon name="check" size={14} />{' '}
              {order.payment.status === 'paid'
                ? `Paid via ${order.payment.label}`
                : order.payment.method === 'cod'
                  ? `${order.payment.label} · pay on delivery`
                  : `${order.payment.label} · payment pending`}
            </div>
            <Button
              variant="ghost"
              full
              onClick={() => router.push(routes.orders())}
              icon="receipt"
            >
              View all orders
            </Button>
            <Button full iconRight="arrowR" onClick={() => router.push(routes.home())}>
              Continue shopping
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

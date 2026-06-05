'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceModal } from '@/components/account/InvoiceModal';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Crumbs } from '@/components/ui/Crumbs';
import { Empty } from '@/components/ui/Empty';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { rupee } from '@/components/ui/Price';
import { catOf, find } from '@/lib/data';
import { fetchUserOrders, timeAgo } from '@/lib/orders';
import { routes } from '@/lib/routes';
import type { Order } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

function statusBadge(order: Order): { className: string; icon: 'check' | 'truck'; label: string } {
  const labels: Record<Order['status'], string> = {
    pending: 'Payment pending',
    confirmed: 'Arriving soon',
    packed: 'Packed',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return {
    className: order.status === 'delivered' ? 'order-delivered' : 'order-confirmed',
    icon: order.status === 'delivered' ? 'check' : 'truck',
    label: labels[order.status] ?? order.status,
  };
}

function OrdersContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, showToast } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserOrders(user.uid)
      .then((list) => active && setOrders(list))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const reorder = (order: Order) => {
    order.items.forEach((it) => addToCart(it.productId, it.qty));
    showToast('Items added to cart');
    router.push(routes.cart());
  };

  if (loading) {
    return (
      <div className="page orders">
        <Empty icon="receipt" title="Loading your orders…" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page orders">
        <h1 className="page-title">Your orders</h1>
        <Empty
          icon="receipt"
          title="No orders yet"
          sub="Your past orders and invoices will appear here."
        >
          <Button onClick={() => router.push(routes.browse())} iconRight="arrowR">
            Shop now
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page orders">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'Orders' }]} />
      <h1 className="page-title">Your orders</h1>
      <div className="order-list">
        {orders.map((o) => {
          const badge = statusBadge(o);
          const count = o.items.reduce((a, b) => a + b.qty, 0);
          return (
            <div className="order-card" key={o.id}>
              <div className="order-top">
                <div>
                  <span className={`order-status ${badge.className}`}>
                    <Icon name={badge.icon} size={14} />
                    {badge.label}
                  </span>
                  <b className="order-id">#{o.id}</b>
                </div>
                <span className="order-time">{timeAgo(o.placedAt)}</span>
              </div>
              <div className="order-thumbs">
                {o.items.slice(0, 5).map((it) => {
                  const product = find(it.productId);
                  return (
                    <Img
                      key={it.productId}
                      cat={product ? catOf(product.cat) : undefined}
                      ratio="1 / 1"
                      radius="10px"
                      className="order-thumb"
                      label={it.name}
                    />
                  );
                })}
                {o.items.length > 5 && <span className="order-more">+{o.items.length - 5}</span>}
              </div>
              <div className="order-bottom">
                <div className="order-sum">
                  <b>{rupee(o.totals.grand)}</b>
                  <span>
                    {count} items · {o.payment.label}
                  </span>
                </div>
                <div className="order-btns">
                  <Button variant="ghost" size="sm" icon="receipt" onClick={() => setInvoice(o)}>
                    Invoice
                  </Button>
                  {o.status !== 'delivered' ? (
                    <Button
                      size="sm"
                      iconRight="arrowR"
                      onClick={() => router.push(routes.confirm(o.id))}
                    >
                      Track
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => reorder(o)}>
                      Reorder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}

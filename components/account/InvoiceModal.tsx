'use client';

import { useState } from 'react';
import { Logo } from '@/components/chrome/Logo';
import { BillRows } from '@/components/cart/BillRows';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { rupee } from '@/components/ui/Price';
import { downloadInvoice } from '@/lib/invoice-pdf';
import type { Order } from '@/lib/types';
import { useCart } from '@/store/cart';

/** Tax-invoice modal with a real PDF download (snapshot prices). */
export function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { showToast } = useCart();
  const [downloading, setDownloading] = useState(false);

  const payStatus =
    order.payment.status === 'paid'
      ? 'Paid'
      : order.payment.method === 'cod'
        ? 'Pay on delivery'
        : 'Pending';

  const download = async () => {
    setDownloading(true);
    try {
      await downloadInvoice(order);
      showToast('Invoice downloaded');
    } catch {
      showToast('Could not generate the invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal invoice" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
        <div className="inv-head">
          <Logo />
          <div className="inv-meta">
            <b>Tax Invoice</b>
            <span>#{order.id}</span>
            <span>
              {new Date(order.placedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>
        <div className="inv-to">
          <div>
            <i>Billed to</i>
            <b>{order.address.name}</b>
            <span>
              {order.address.line1}, {order.address.city} – {order.address.pin}
            </span>
          </div>
          <div>
            <i>Payment</i>
            <b>{order.payment.label}</b>
            <span className="free">{payStatus}</span>
          </div>
        </div>
        <table className="inv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.productId}>
                <td>
                  {it.name}
                  <i>{it.unit}</i>
                </td>
                <td>{it.qty}</td>
                <td>{rupee(it.price)}</td>
                <td>{rupee(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inv-bill">
          <BillRows bill={order.totals} />
        </div>
        <div className="inv-foot">
          <span>
            <Icon name="shield" size={14} /> This is a system-generated invoice · FSSAI
            100xxxxxxxx1234
          </span>
          <Button icon="receipt" disabled={downloading} onClick={download}>
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}

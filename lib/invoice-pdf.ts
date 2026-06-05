/**
 * Client-side invoice PDF generation (lazy-loads jsPDF).
 *
 * Always renders from the order's price snapshot (`order.items` / `order.totals`),
 * never live catalogue prices, so historical invoices stay correct.
 */
import type { Order } from '@/lib/types';

// Standard PDF fonts lack the ₹ glyph; use "Rs" in the generated file.
const money = (n: number) => 'Rs ' + n.toLocaleString('en-IN');

/** Generate and download a tax-invoice PDF for an order. */
export async function downloadInvoice(order: Order): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 40;
  const right = 555;
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FreshMart', left, y);
  doc.setFontSize(12);
  doc.text('Tax Invoice', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`#${order.id}`, right, y + 16, { align: 'right' });
  doc.text(
    new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    right,
    y + 30,
    { align: 'right' },
  );

  y += 60;
  doc.setDrawColor(220);
  doc.line(left, y, right, y);

  // Billed to + payment
  y += 22;
  const { address, payment } = order;
  doc.setFont('helvetica', 'bold');
  doc.text('Billed to', left, y);
  doc.text('Payment', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 15;
  doc.text(address.name, left, y);
  doc.text(payment.label, right, y, { align: 'right' });
  y += 14;
  doc.text(`${address.line1}, ${address.city} - ${address.pin}`, left, y);
  const payStatus =
    payment.status === 'paid' ? 'Paid' : payment.method === 'cod' ? 'Pay on delivery' : 'Pending';
  doc.text(payStatus, right, y, { align: 'right' });

  // Items table header
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Item', left, y);
  doc.text('Qty', 360, y, { align: 'right' });
  doc.text('Rate', 450, y, { align: 'right' });
  doc.text('Amount', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.line(left, y + 6, right, y + 6);
  y += 24;

  for (const it of order.items) {
    doc.text(it.name.length > 48 ? it.name.slice(0, 47) + '…' : it.name, left, y);
    doc.text(String(it.qty), 360, y, { align: 'right' });
    doc.text(money(it.price), 450, y, { align: 'right' });
    doc.text(money(it.price * it.qty), right, y, { align: 'right' });
    y += 20;
  }

  // Totals
  y += 6;
  doc.line(350, y, right, y);
  y += 18;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, 450, y, { align: 'right' });
    doc.text(value, right, y, { align: 'right' });
    y += 16;
  };
  totalRow('Item total', money(order.totals.items));
  totalRow('Delivery', order.totals.delivery === 0 ? 'FREE' : money(order.totals.delivery));
  totalRow('Handling', money(order.totals.handling));
  if (order.totals.discount > 0) totalRow('Discount', '- ' + money(order.totals.discount));
  totalRow('To pay', money(order.totals.grand), true);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    'This is a system-generated invoice  •  FSSAI Lic. 100xxxxxxxx1234  •  FreshMart Retail Pvt. Ltd.',
    left,
    800,
  );

  doc.save(`FreshMart-invoice-${order.id}.pdf`);
}

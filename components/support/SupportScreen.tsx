'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Crumbs } from '@/components/ui/Crumbs';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { db } from '@/lib/firebase/client';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

const FAQS = [
  {
    q: 'How fast is delivery?',
    a: 'Most orders arrive within 30 minutes from your nearest FreshMart store, depending on your location and time of day.',
  },
  {
    q: 'What if a product isn’t fresh?',
    a: 'Report it at delivery or within 24 hours from your order page. We’ll issue an instant refund — no questions asked.',
  },
  {
    q: 'Which payment methods are accepted?',
    a: 'UPI, credit/debit cards, wallets, net banking, and Cash on Delivery.',
  },
  {
    q: 'Can I schedule a delivery?',
    a: 'Yes — choose a delivery slot at checkout for orders you’d like later in the day.',
  },
];

const TOPICS = [
  'Order issue',
  'Refund & returns',
  'Payment problem',
  'Delivery delay',
  'Account help',
  'Other',
];

/** Support centre: contact channels, FAQ, and a ticket form (→ supportTickets). */
export function SupportScreen() {
  const { user } = useAuth();
  const { showToast } = useCart();
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({ topic: 'Order issue', order: '', msg: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.msg.trim() || submitting) return;
    setSubmitting(true);
    const ticketId = 'SR' + Math.floor(10000 + Math.random() * 89999);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        ticketId,
        uid: user?.uid ?? null,
        topic: f.topic,
        orderId: f.order.trim(),
        message: f.msg.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setSent(ticketId);
    } catch {
      showToast('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page support">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'Support' }]} />
      <header className="support-hero">
        <h1>How can we help?</h1>
        <p>We’re here around the clock. Browse common questions or send us a message.</p>
        <div className="support-quick">
          <a className="support-chan" href="tel:1800200FRESH">
            <Icon name="phone" size={18} />
            <div>
              <b>Call us</b>
              <i>1800-200-FRESH</i>
            </div>
          </a>
          <a className="support-chan" href="mailto:care@freshmart.in">
            <Icon name="mail" size={18} />
            <div>
              <b>Email</b>
              <i>care@freshmart.in</i>
            </div>
          </a>
          <a className="support-chan">
            <Icon name="info" size={18} />
            <div>
              <b>Live chat</b>
              <i>Avg. reply 2 min</i>
            </div>
          </a>
        </div>
      </header>

      <div className="support-grid">
        <div className="support-faq">
          <h2>Frequently asked</h2>
          {FAQS.map((it) => (
            <details key={it.q} className="faq">
              <summary>
                {it.q}
                <Icon name="chevD" size={16} />
              </summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>

        <div className="support-form-card">
          <h2>Submit a request</h2>
          {sent ? (
            <div className="support-done">
              <div className="confirm-check small">
                <Icon name="check" size={26} stroke={2.4} />
              </div>
              <b>Request submitted</b>
              <p>
                Ticket <b>#{sent}</b> created. We’ll reply within 4 hours.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSent(null);
                  setF({ topic: 'Order issue', order: '', msg: '' });
                }}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="field field-wide">
                <span>Topic</span>
                <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Order ID (optional)"
                value={f.order}
                onChange={(e) => setF({ ...f, order: e.target.value })}
                placeholder="#FM100236"
                wide
              />
              <label className="field field-wide">
                <span>Message</span>
                <textarea
                  rows={5}
                  value={f.msg}
                  onChange={(e) => setF({ ...f, msg: e.target.value })}
                  placeholder="Tell us what happened…"
                />
              </label>
              <Button
                size="lg"
                full
                type="submit"
                disabled={!f.msg.trim() || submitting}
                iconRight="arrowR"
              >
                {submitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

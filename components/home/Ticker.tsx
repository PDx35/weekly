import { Icon, type IconName } from '@/components/ui/Icon';

const ITEMS: { icon: IconName; text: string }[] = [
  { icon: 'bolt', text: 'Delivery in 30 minutes' },
  { icon: 'truck', text: 'Free delivery on orders over ₹199' },
  { icon: 'leaf', text: 'Farm-fresh, sourced & packed daily' },
  { icon: 'tag', text: 'Use code SAVE10 for 10% off' },
  { icon: 'shield', text: '100% quality promise — not fresh? full refund' },
];

/**
 * Scrolling promo ticker shown under the hero. The track holds two identical
 * copies of the items so the CSS marquee (`translateX(-50%)`) loops seamlessly.
 */
export function Ticker() {
  return (
    <div className="ticker" aria-label="Promotions">
      <div className="ticker-track">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span className="ticker-item" key={i}>
            <Icon name={item.icon} size={15} /> {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/lib/data';
import { routes } from '@/lib/routes';

/**
 * Home (Sprint 0 shell). A lightweight hero plus the category grid so the
 * design tokens and chrome are visible end to end. The full home (hero basket,
 * rails, promos) is built in Sprint 1.
 */
export default function HomePage() {
  return (
    <div className="page">
      <section className="hero-basket">
        <div className="hero-copy">
          <span className="hero-eyebrow light">
            <Icon name="bolt" size={14} /> 30-minute delivery
          </span>
          <h1>
            Farm-fresh groceries, <span>delivered fast</span>
          </h1>
          <p>
            Handpicked fruits, vegetables, dairy, and daily essentials at honest prices — at your
            door in half an hour.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-onbrand btn-lg" href={routes.browse()}>
              Start shopping
            </Link>
            <Link className="btn btn-ghost btn-lg" href={routes.support()}>
              Get help
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <b>5,000+</b>
              <i>products</i>
            </div>
            <div>
              <b>30 min</b>
              <i>avg delivery</i>
            </div>
            <div>
              <b>4.8★</b>
              <i>customer rating</i>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <div
            className="ph hero-img"
            style={{
              aspectRatio: '1 / 1',
              background: '#E9F4ED',
              color: '#1E6B43',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div className="ph-stripes" />
            <span className="ph-label">fresh basket</span>
          </div>
        </div>
      </section>

      <h2 className="sec-head" style={{ marginTop: 40 }}>
        Shop by category
      </h2>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.id} className="cat-tile" href={routes.category(c.id)}>
            <div
              className="cat-tile-img"
              style={{ background: c.tint, color: c.ink }}
              aria-hidden="true"
            >
              <Icon name="leaf" size={26} />
            </div>
            <b>{c.name}</b>
            <i>{c.blurb}</i>
          </Link>
        ))}
      </div>
    </div>
  );
}

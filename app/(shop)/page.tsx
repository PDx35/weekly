import Link from 'next/link';
import { Rail } from '@/components/catalogue/Rail';
import { CategorySection } from '@/components/home/CategorySection';
import { Ticker } from '@/components/home/Ticker';
import { WeeklyMarket } from '@/components/market/WeeklyMarket';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { SectionHead } from '@/components/ui/SectionHead';
import {
  getBestsellers,
  getCategories,
  getDeals,
  getProductsByCategory,
  getWeeklyMarket,
} from '@/lib/queries';
import { routes } from '@/lib/routes';

/** Catalogue is statically generated and revalidated hourly (ISR). */
export const revalidate = 3600;

/**
 * Home page. Server Component: hero, promo ticker, promo strip, category grid,
 * best-sellers rail, weekend banner, today's deals, then per-category sections
 * (alternating, category-coloured layouts). Data comes from the `queries` layer.
 */
export default async function HomePage() {
  const [categories, bestsellers, deals, market] = await Promise.all([
    getCategories(),
    getBestsellers(),
    getDeals(),
    getWeeklyMarket(),
  ]);

  // Products per category for the home category sections (skip empty ones).
  const categorySections = (
    await Promise.all(
      categories.map(async (category) => ({
        category,
        products: await getProductsByCategory(category.id),
      })),
    )
  ).filter((s) => s.products.length > 0);

  // Link the hero/banner CTAs to a real category (fall back to browse).
  const featuredHref = categories[0] ? routes.category(categories[0].slug) : routes.browse();

  return (
    <div className="page home">
      {/* Hero (basket) */}
      <section className="hero hero-basket">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <Icon name="bolt" size={14} /> Delivery in 30 minutes
          </span>
          <h1>
            Fresh groceries,
            <br />
            <span>delivered fast.</span>
          </h1>
          <p>
            From farm to your kitchen — fruits, vegetables, dairy and daily essentials, handpicked
            and delivered to your door.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" href={routes.browse()}>
              <span>Start shopping</span>
              <Icon name="arrowR" size={18} />
            </Link>
            <Link className="btn btn-ghost btn-lg" href={featuredHref}>
              <span>Today&apos;s deals</span>
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <b>30 min</b>
              <i>Avg. delivery</i>
            </div>
            <div>
              <b>5,000+</b>
              <i>Products</i>
            </div>
            <div>
              <b>4.8★</b>
              <i>Customer rating</i>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <Img
            label="hero basket of fresh produce"
            ratio="1 / 1"
            className="hero-img"
            cat={{ tint: '#E7F3E4', ink: '#3C7A36' }}
            radius="calc(var(--radius-card) * 1.4)"
          />
          <div className="hero-chip hero-chip-1">
            <Icon name="truck" size={16} /> Out for delivery
          </div>
          <div className="hero-chip hero-chip-2">
            <Icon name="leaf" size={16} /> Sourced today
          </div>
        </div>
      </section>

      {/* Promo ticker */}
      <Ticker />

      {/* Promo strip */}
      <section className="promo">
        <div className="promo-item">
          <Icon name="truck" size={22} />
          <div>
            <b>Free delivery</b>
            <i>On orders over ₹199</i>
          </div>
        </div>
        <div className="promo-item">
          <Icon name="clock" size={22} />
          <div>
            <b>30-minute delivery</b>
            <i>From dark stores near you</i>
          </div>
        </div>
        <div className="promo-item">
          <Icon name="leaf" size={22} />
          <div>
            <b>Farm fresh</b>
            <i>Sourced &amp; packed daily</i>
          </div>
        </div>
        <div className="promo-item">
          <Icon name="shield" size={22} />
          <div>
            <b>Quality promise</b>
            <i>Not fresh? Full refund</i>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <div className="sec-head">
        <div>
          <h2>Shop by category</h2>
        </div>
      </div>
      <section className="cat-grid-wrap">
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} className="cat-tile" href={routes.category(c.slug)}>
              <span
                className="cat-tile-img"
                style={{ background: c.tint, color: c.ink, overflow: 'hidden' }}
              >
                {c.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
                  <img
                    src={c.iconUrl}
                    alt={c.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon name="leaf" size={26} stroke={1.6} />
                )}
              </span>
              <b>{c.name}</b>
              {c.blurb && <i>{c.blurb}</i>}
            </Link>
          ))}
        </div>
      </section>

      {/* Weekly travelling market */}
      <section className="rail-sec">
        <SectionHead
          title="Weekly market near you"
          sub="Our travelling market visits a new area each day — get extra savings when it reaches your pincode."
        />
        <WeeklyMarket schedule={market} />
      </section>

      {/* Best sellers */}
      <Rail
        title="Best sellers"
        sub="What everyone's adding to cart"
        action="View all"
        actionHref={routes.browse()}
        products={bestsellers}
      />

      {/* Weekend savings banner */}
      <section className="banner">
        <div className="banner-copy">
          <span className="hero-eyebrow light">
            <Icon name="tag" size={14} /> Weekend savings
          </span>
          <h2>Up to 30% off on staples</h2>
          <p>Stock up on rice, dal, atta and oils. Limited-time prices, refreshed every week.</p>
          <Link className="btn btn-onbrand btn-md" href={featuredHref}>
            <span>Shop staples</span>
            <Icon name="arrowR" size={18} />
          </Link>
        </div>
        <Img
          label="pantry staples"
          ratio="3 / 2"
          cat={{ tint: 'rgba(255,255,255,.18)', ink: 'rgba(255,255,255,.9)' }}
          className="banner-img"
          radius="calc(var(--radius-card))"
        />
      </section>

      {/* Today's deals */}
      <Rail
        title="Today's deals"
        sub="Fresh markdowns, while stocks last"
        action="View all"
        actionHref={routes.browse()}
        products={deals}
      />

      {/* Per-category sections (alternating, category-coloured layouts) */}
      {categorySections.map(({ category, products }, i) => (
        <CategorySection key={category.id} category={category} products={products} variant={i} />
      ))}
    </div>
  );
}

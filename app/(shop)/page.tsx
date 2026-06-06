import Link from 'next/link';
import { Rail } from '@/components/catalogue/Rail';
import { CategorySection } from '@/components/home/CategorySection';
import { Ticker } from '@/components/home/Ticker';
import { AnnouncementBanner } from '@/components/serviceability/AnnouncementBanner';

// import { WeeklyMarket } from '@/components/market/WeeklyMarket';
// import { SectionHead } from '@/components/ui/SectionHead';

import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { CategoryGrid } from '@/components/catalogue/CategoryGrid';
import { getBestsellers, getCategories, getDeals, getProductsByCategory } from '@/lib/queries';
import { routes } from '@/lib/routes';

/** Catalogue is statically generated and revalidated hourly (ISR). */
export const revalidate = 3600;

/**
 * Home page. Server Component: hero, promo ticker, promo strip, category grid,
 * best-sellers rail, weekend banner, today's deals, then per-category sections
 * (alternating, category-coloured layouts). Data comes from the `queries` layer.
 */
export default async function HomePage() {
  const [categories, bestsellers, deals] = await Promise.all([
    getCategories(),
    getBestsellers(),
    getDeals(),
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
      {/* Delivery serviceability announcement */}
      <AnnouncementBanner />

      {/* Hero — daily essentials banner */}
      <section className="hero-essentials">
        <div className="hero-essentials-copy">
          <h1>Stock up on daily essentials</h1>
          <p>Get farm-fresh goodness &amp; a range of exotic fruits, vegetables, eggs &amp; more</p>
          <Link className="btn btn-onbrand btn-lg" href={routes.browse()}>
            <span>Shop Now</span>
          </Link>
        </div>
        <Img
          label="basket of fresh produce, eggs and dairy"
          ratio="16 / 10"
          className="hero-essentials-img"
          cat={{ tint: 'rgba(255,255,255,.16)', ink: 'rgba(255,255,255,.9)' }}
          radius="calc(var(--radius-card) * 1.2)"
        />
      </section>

      {/* Promo cards */}
      <section className="promo-cards">
        <Link className="promo-card promo-card-teal" href={featuredHref}>
          <div className="promo-card-copy">
            <h3>
              Pharmacy at
              <br />
              your doorstep!
            </h3>
            <p>Cough syrups, pain relief sprays &amp; more</p>
            <span className="promo-card-btn">Order Now</span>
          </div>
          <Img
            label="medicines and pharmacy"
            ratio="1 / 1"
            className="promo-card-img"
            cat={{ tint: 'rgba(255,255,255,.4)', ink: '#1d6e6a' }}
          />
        </Link>
        <Link className="promo-card promo-card-amber" href={featuredHref}>
          <div className="promo-card-copy">
            <h3>
              Pet care supplies
              <br />
              at your door
            </h3>
            <p>Food, treats, toys &amp; more</p>
            <span className="promo-card-btn">Order Now</span>
          </div>
          <Img
            label="pet food and supplies"
            ratio="1 / 1"
            className="promo-card-img"
            cat={{ tint: 'rgba(255,255,255,.45)', ink: '#9a7400' }}
          />
        </Link>
        <Link className="promo-card promo-card-slate" href={featuredHref}>
          <div className="promo-card-copy">
            <h3>
              No time for
              <br />a diaper run?
            </h3>
            <p>Get baby care essentials</p>
            <span className="promo-card-btn">Order Now</span>
          </div>
          <Img
            label="baby care essentials"
            ratio="1 / 1"
            className="promo-card-img"
            cat={{ tint: 'rgba(255,255,255,.5)', ink: '#4a5b6b' }}
          />
        </Link>
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
      <CategoryGrid categories={categories} />

      {/* Weekly travelling market 
      <section className="rail-sec">
        <SectionHead
          title="Weekly market near you"
          sub="Our travelling market visits a new area each day — get extra savings when it reaches your pincode."
        />
        <WeeklyMarket schedule={market} />
      </section>*/}

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

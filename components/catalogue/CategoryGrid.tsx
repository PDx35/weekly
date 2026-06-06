import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import type { Category } from '@/lib/types';

interface CategoryGridProps {
  categories: Category[];
  activeSlug?: string;
  title?: string | null;
}

/**
 * A responsive grid of category tiles for navigation.
 * Server component. Highlights the category tile matching `activeSlug`.
 */
export function CategoryGrid({ categories, activeSlug, title = 'Shop by category' }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <>
      {title && (
        <div className="sec-head">
          <div>
            <h2>{title}</h2>
          </div>
        </div>
      )}
      <section className="cat-grid-wrap">
        <div className="cat-grid">
          {categories.map((c) => {
            const isActive = c.slug === activeSlug;
            return (
              <Link
                key={c.id}
                className={`cat-tile ${isActive ? 'active' : ''}`}
                href={routes.category(c.slug)}
              >
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
            );
          })}
        </div>
      </section>
    </>
  );
}

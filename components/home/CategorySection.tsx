import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ProductCard } from '@/components/ui/ProductCard';
import { routes } from '@/lib/routes';
import type { Category, Product } from '@/lib/types';

interface Props {
  category: Category;
  products: Product[];
  /** Picks the layout (cycled by the caller so adjacent sections differ). */
  variant: number;
}

function Rail({ products }: { products: Product[] }) {
  return (
    <div className="rail">
      {products.slice(0, 10).map((p) => (
        <div className="rail-item" key={p.id}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

/**
 * A home category section, colored by the category's tint/ink. Four layouts are
 * cycled by `variant` so consecutive sections look distinct (bar, panel-left,
 * tinted grid, panel-right).
 */
export function CategorySection({ category, products, variant }: Props) {
  const accent = { background: category.tint, color: category.ink };
  const href = routes.category(category.slug);
  const style = variant % 4;

  // Variant 2 — full tinted background with a product grid.
  if (style === 2) {
    return (
      <section className="catsec catsec-tint" style={{ background: category.tint }}>
        <div className="catsec-tint-head" style={{ color: category.ink }}>
          <h2>{category.name}</h2>
          <Link className="catsec-link" href={href}>
            See all <Icon name="arrowR" size={15} />
          </Link>
        </div>
        <div className="pgrid">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    );
  }

  // Variants 1 & 3 — a colored panel card beside a product rail (sides swap).
  if (style === 1 || style === 3) {
    return (
      <section className={`catsec catsec-panel ${style === 3 ? 'reverse' : ''}`}>
        <div className="catsec-panel-card" style={accent}>
          <span className="catsec-eyebrow">Featured category</span>
          <h2>{category.name}</h2>
          {category.blurb && <p>{category.blurb}</p>}
          <Link className="catsec-link" href={href}>
            Shop all <Icon name="arrowR" size={15} />
          </Link>
        </div>
        <Rail products={products} />
      </section>
    );
  }

  // Variant 0 — a tinted header bar above a product rail.
  return (
    <section className="catsec">
      <div className="catsec-bar" style={accent}>
        <div>
          <h2>{category.name}</h2>
          {category.blurb && <p>{category.blurb}</p>}
        </div>
        <Link className="catsec-link" href={href}>
          See all <Icon name="arrowR" size={15} />
        </Link>
      </div>
      <Rail products={products} />
    </section>
  );
}

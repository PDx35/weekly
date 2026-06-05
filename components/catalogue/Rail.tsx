import { ProductCard } from '@/components/ui/ProductCard';
import { SectionHead } from '@/components/ui/SectionHead';
import type { Product } from '@/lib/types';

interface RailProps {
  title: string;
  sub?: string;
  /** Optional action label (renders only with `actionHref`). */
  action?: string;
  actionHref?: string;
  products: Product[];
}

/** A titled horizontal rail of product cards. Server Component. */
export function Rail({ title, sub, action, actionHref, products }: RailProps) {
  return (
    <section className="rail-sec">
      <SectionHead title={title} sub={sub} action={action} actionHref={actionHref} />
      <div className="rail">
        {products.map((p) => (
          <div className="rail-item" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import type { Product } from '@/lib/types';
import { useCart } from '@/store/cart';
import { Img } from './Img';
import { Price } from './Price';
import { QtyStepper } from './QtyStepper';
import { Rating } from './Rating';

/** Catalogue product card. Clicking the body opens the product page; the footer
 * quantity controls add to cart without navigating. */
export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { cart, setQty } = useCart();
  const qty = cart[product.id] || 0;

  return (
    <article className="pcard" onClick={() => router.push(routes.product(product.id))}>
      <div className="pcard-img">
        <Img product={product} radius="calc(var(--radius-card) * 0.7)" />
        {product.tag && <span className="pcard-tag">{product.tag}</span>}
        {product.mrp && (
          <span className="pcard-save">
            {Math.round((1 - product.price / product.mrp) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="pcard-body">
        <div className="pcard-unit">{product.unit}</div>
        <h3 className="pcard-name">{product.name}</h3>
        <Rating value={product.rating} reviews={product.reviews} />
        <div className="pcard-foot" onClick={(e) => e.stopPropagation()}>
          <Price value={product.price} mrp={product.mrp} size="sm" />
          <QtyStepper qty={qty} size="sm" onChange={(q) => setQty(product.id, q)} />
        </div>
      </div>
    </article>
  );
}

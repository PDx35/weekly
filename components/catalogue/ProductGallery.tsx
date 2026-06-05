'use client';

import { useState } from 'react';
import { Img } from '@/components/ui/Img';
import type { Product } from '@/lib/types';

const PLACEHOLDER_VIEWS = ['front', 'pack', 'detail', 'use'] as const;

/**
 * Product image gallery with a thumbnail switcher. Uses the product's real
 * images when present; otherwise falls back to four tinted placeholder "views".
 */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const hasImages = product.images.length > 0;
  const count = hasImages ? product.images.length : PLACEHOLDER_VIEWS.length;

  return (
    <div className="pd-gallery">
      <div className="pd-main">
        <Img
          product={product}
          src={hasImages ? product.images[active] : undefined}
          label={hasImages ? product.name : `${product.name} — ${PLACEHOLDER_VIEWS[active]}`}
          ratio="1 / 1"
          radius="calc(var(--radius-card))"
        />
        {product.tag && <span className="pcard-tag pd-tag">{product.tag}</span>}
      </div>
      {count > 1 && (
        <div className="pd-thumbs">
          {Array.from({ length: Math.min(count, 4) }, (_, i) => (
            <button
              key={i}
              className={`pd-thumb ${active === i ? 'on' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`View ${i + 1}`}
            >
              <Img
                product={product}
                src={hasImages ? product.images[i] : undefined}
                label={hasImages ? product.name : PLACEHOLDER_VIEWS[i]}
                ratio="1 / 1"
                radius="10px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

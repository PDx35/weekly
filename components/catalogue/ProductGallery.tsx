'use client';

import { useState } from 'react';
import { Img } from '@/components/ui/Img';
import type { Product } from '@/lib/types';

const THUMB_LABELS = ['front', 'pack', 'detail', 'use'] as const;

/**
 * Product image gallery with a thumbnail switcher. The mock catalogue has no
 * real photos yet, so this renders tinted placeholder tiles (one "view" per
 * thumbnail); real images slot in once the admin panel imports them.
 */
export function ProductGallery({ product }: { product: Product }) {
  const [activeImg, setActiveImg] = useState(0);
  return (
    <div className="pd-gallery">
      <div className="pd-main">
        <Img
          product={product}
          label={`${product.name} — view ${activeImg + 1}`}
          ratio="1 / 1"
          radius="calc(var(--radius-card))"
        />
        {product.tag && <span className="pcard-tag pd-tag">{product.tag}</span>}
      </div>
      <div className="pd-thumbs">
        {THUMB_LABELS.map((label, i) => (
          <button
            key={label}
            className={`pd-thumb ${activeImg === i ? 'on' : ''}`}
            onClick={() => setActiveImg(i)}
            aria-label={`View ${label}`}
          >
            <Img product={product} label={label} ratio="1 / 1" radius="10px" />
          </button>
        ))}
      </div>
    </div>
  );
}

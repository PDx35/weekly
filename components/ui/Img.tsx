import { catOf } from '@/lib/data';
import type { Product } from '@/lib/types';

interface ImgProps {
  /** Product whose image (or category tint) drives the tile. */
  product?: Product;
  /** Explicit image URL to render (takes precedence). */
  src?: string;
  /** Explicit tint/ink for the placeholder when there is no image. */
  cat?: { tint?: string; ink?: string };
  /** CSS `aspect-ratio` value. */
  ratio?: string;
  /** Override label / alt text. */
  label?: string;
  className?: string;
  /** Override border radius. */
  radius?: string;
}

/**
 * Product image tile. Renders the real image when one is available (explicit
 * `src`, else the product's first image); otherwise falls back to a tinted
 * monospace-labelled placeholder. Arbitrary admin-entered hosts mean we use a
 * plain <img> rather than next/image (no remotePatterns whitelist to maintain).
 */
export function Img({
  product,
  src,
  cat,
  ratio = '1 / 1',
  label,
  className = '',
  radius,
}: ImgProps) {
  const imageUrl = src ?? product?.images?.[0] ?? (product as any)?.imageUrls?.[0];
  const text = label || (product ? product.name : 'product photo');

  if (imageUrl) {
    return (
      <div
        className={`ph ${className}`}
        style={{ aspectRatio: ratio, borderRadius: radius, overflow: 'hidden' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts */}
        <img
          src={imageUrl}
          alt={text}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  const c = product ? catOf(product.cat) : cat;
  const tint = c?.tint ?? '#EEF1F2';
  const ink = c?.ink ?? '#566066';
  return (
    <div
      className={`ph ${className}`}
      style={{ aspectRatio: ratio, background: tint, color: ink, borderRadius: radius }}
    >
      <div className="ph-stripes" />
      <span className="ph-label">{text}</span>
    </div>
  );
}

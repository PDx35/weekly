import { catOf } from '@/lib/data';
import type { Product } from '@/lib/types';

interface ImgProps {
  /** Product whose category drives the tint (takes precedence over `cat`). */
  product?: Product;
  /** Explicit tint/ink for tinting when there is no product. */
  cat?: { tint?: string; ink?: string };
  /** CSS `aspect-ratio` value. */
  ratio?: string;
  /** Override label text shown on the tile. */
  label?: string;
  className?: string;
  /** Override border radius. */
  radius?: string;
}

/**
 * Placeholder image tile, tinted by category with a monospace label. Mirrors the
 * prototype `Img` (real product photos arrive with the Firestore catalogue in a
 * later sprint).
 */
export function Img({ product, cat, ratio = '1 / 1', label, className = '', radius }: ImgProps) {
  const c = product ? catOf(product.cat) : cat;
  const tint = c?.tint ?? '#EEF1F2';
  const ink = c?.ink ?? '#566066';
  const text = label || (product ? product.name : 'product photo');
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

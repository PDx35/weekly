

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { routes } from '@/lib/routes';
import { Img } from '@/components/ui/Img';
import { Rating } from '@/components/ui/Rating';
import { Price } from '@/components/ui/Price';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { VariantPickerSheet } from '@/components/catalogue/VariantPickerSheet';
import type { Product } from '@/lib/types';

/** Total units in the cart for a product family (base option + every variant). */
export function familyQty(cart: Record<string, number>, product: Product): number {
  let total = cart[product.id] || 0;
  for (const v of product.variants ?? []) total += cart[v.id] || 0;
  return total;
}

/**
 * Cart control for a product card. Plain {@link QtyStepper} when the product has
 * no variants; for products with variants it shows an "ADD" button that opens
 * the {@link VariantPickerSheet} so the shopper picks a pack size first.
 */
export function AddOrVariant({
  product,
  size = 'sm',
}: {
  product: Product;
  size?: 'sm' | 'md';
}) {
  const { cart, setQty, showToast } = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasVariants = (product.variants?.length ?? 0) > 0;

  if (!hasVariants) {
    const qty = cart[product.id] || 0;
    const handleQtyChange = (q: number) => {
      if (q > product.inventory) {
        showToast(`Only ${product.inventory} units of ${product.name} are available.`);
        return;
      }
      setQty(product.id, q);
    };
    return <QtyStepper qty={qty} size={size} onChange={handleQtyChange} />;
  }

  const total = familyQty(cart, product);
  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetOpen(true);
  };

  return (
    <>
      {total > 0 ? (
        <button
          onClick={open}
          aria-label={`Edit pack sizes for ${product.name}`}
          className={`qty-add qty-${size} flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-95`}
        >
          {total} <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">in cart</span>
        </button>
      ) : (
        <button
          onClick={open}
          aria-label={`Choose a pack size for ${product.name}`}
          className={`qty-add qty-${size} flex items-center justify-center rounded-xl border border-emerald-600 font-extrabold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-700 hover:bg-emerald-50 active:scale-95`}
        >
          <span className="mr-1.5 text-base font-black text-emerald-700">+</span> ADD
        </button>
      )}
      {sheetOpen && <VariantPickerSheet product={product} onClose={() => setSheetOpen(false)} />}
    </>
  );
}

// Shared Wishlist Hook
export function useWishlist(productId: string) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('freshmart_wishlist') || '[]');
      setIsWishlisted(wishlist.includes(productId));
    } catch { }
  }, [productId]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const wishlist = JSON.parse(localStorage.getItem('freshmart_wishlist') || '[]');
      let nextWishlist: string[];
      if (wishlist.includes(productId)) {
        nextWishlist = wishlist.filter((id: string) => id !== productId);
      } else {
        nextWishlist = [...wishlist, productId];
      }
      localStorage.setItem('freshmart_wishlist', JSON.stringify(nextWishlist));
      setIsWishlisted(nextWishlist.includes(productId));
    } catch { }
  };

  return { isWishlisted, toggleWishlist };
}

/** Style 2: Standard/Premium Product Card.
 * Ideal for grids and standard catalog pages. */
export function ProductCard({
  product,
  className,
  layout = 'vertical'
}: {
  product: Product;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'responsive';
}) {
  const router = useRouter();
  const { cart } = useCart();
  const qty = familyQty(cart, product);
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);

  const isAvailable = product.stock && product.inventory > 0;

  const layoutClass = layout === 'horizontal'
    ? 'horizontal'
    : layout === 'responsive'
      ? 'responsive-horizontal'
      : '';

  return (
    <article className={`pcard relative group ${layoutClass} ${className || ''}`} onClick={() => router.push(routes.product(product.slug))}>
      <div className="pcard-img relative overflow-hidden bg-neutral-50 flex items-center justify-center">
        <Img product={product} radius="calc(var(--radius-card) * 0.7)" />

        {/* Wishlist Heart Icon */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 hover:text-red-500 hover:bg-white shadow-sm border border-neutral-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className={isWishlisted ? "text-red-500" : ""}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Inventory / Stock Badges (out-of-stock state is shown via the
            bottom action button, so no image badge for it). */}
        {isAvailable && product.inventory < 5 ? (
          <span className="pcard-badge-stock absolute top-3 left-3 z-10 rounded-lg bg-amber-500 text-neutral-950 font-extrabold text-[10px] px-2.5 py-1 uppercase tracking-wider shadow-sm">
            <span className="stock-full">Only {product.inventory} Left</span>
            <span className="stock-short">Low</span>
          </span>
        ) : product.tag ? (
          <span className="pcard-tag">{product.tag}</span>
        ) : null}

        {/* Fast Delivery Badge */}
        {isAvailable && (
          <span className="pcard-badge-delivery absolute bottom-3 right-3 z-10 bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-[8.5px] px-2 py-0.5 rounded-md tracking-wider uppercase flex items-center gap-1">
            ⚡ 15 MINS
          </span>
        )}

        {/* Quantity in Cart Badge Overlay */}
        {qty > 0 && (
          <span className="pcard-cart-qty absolute bottom-3 left-3 z-10 rounded-lg bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 shadow-md border border-white/20 select-none">
            <span className="qty-count">{qty}</span>
            <span className="qty-label"> in cart</span>
          </span>
        )}

        {product.mrp && !product.tag && isAvailable && product.inventory >= 5 && (
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
          {!isAvailable ? (
            <button disabled className="qty-add qty-sm bg-neutral-100 border-neutral-250 text-neutral-400 cursor-not-allowed font-bold text-xs flex items-center justify-center" >
              <span className="stock-full">Out of Stock</span>
            </button>
          ) : (
            <AddOrVariant product={product} size="sm" />
          )}
        </div>
      </div>
    </article>
  );
}

/** Style 1: Compact Product Card.
 * Space-saving card perfect for compact scrolling lists or rails. */
export function ProductCardCompact({ product }: { product: Product }) {
  const router = useRouter();
  const { cart } = useCart();
  const qty = familyQty(cart, product);
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);

  const isAvailable = product.stock && product.inventory > 0;

  return (
    <article className="w-full h-full bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between p-2.5 relative group" onClick={() => router.push(routes.product(product.slug))}>
      <div className="relative aspect-square w-full bg-neutral-50 rounded-xl overflow-hidden flex items-center justify-center">
        <Img product={product} radius="12px" />

        {/* Heart */}
        <button
          onClick={toggleWishlist}
          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-neutral-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors border border-neutral-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className={isWishlisted ? "text-red-500" : ""}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Badges */}
        {!isAvailable ? (
          <span className="absolute top-1.5 left-1.5 z-10 rounded bg-red-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 uppercase tracking-wider">
            Out
          </span>
        ) : product.inventory < 5 ? (
          <span className="absolute top-1.5 left-1.5 z-10 rounded bg-amber-500 text-neutral-950 font-extrabold text-[8px] px-1.5 py-0.5 uppercase tracking-wider">
            Low
          </span>
        ) : product.mrp ? (
          <span className="absolute top-1.5 left-1.5 z-10 bg-amber-500 text-neutral-950 font-black text-[8px] px-1.5 py-0.5 rounded">
            {Math.round((1 - product.price / product.mrp) * 100)}%
          </span>
        ) : null}

        {/* Delivery */}
        {isAvailable && (
          <span className="absolute bottom-1.5 right-1.5 z-10 bg-neutral-900/70 backdrop-blur-[2px] text-white font-bold text-[7.5px] px-1.5 py-0.5 rounded tracking-wider uppercase">
            ⚡ 15m
          </span>
        )}

        {/* Qty count badge */}
        {qty > 0 && (
          <span className="absolute bottom-1.5 left-1.5 z-10 bg-emerald-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-sm">
            {qty} in cart
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1 text-left flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-semibold text-neutral-400 block truncate">{product.unit}</span>
          <h3 className="font-bold text-neutral-800 text-[13px] leading-tight line-clamp-2 min-h-[32px]">{product.name}</h3>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-50/60" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <span className="font-black text-emerald-750 text-[13px]">₹{product.price}</span>
            {product.mrp && (
              <s className="text-[9px] text-neutral-400 font-semibold leading-none">₹{product.mrp}</s>
            )}
          </div>

          {!isAvailable ? (
            <button className="h-7 px-2 bg-neutral-50 text-neutral-400 text-[9px] font-bold border border-neutral-100 rounded-lg cursor-not-allowed" disabled>
              Out
            </button>
          ) : (
            <AddOrVariant product={product} size="sm" />
          )}
        </div>
      </div>
    </article>
  );
}

/** Style 3: Offer Highlighted Product Card.
 * Card highlighting high discount offers, best for promo carousels and flash sales. */
export function ProductCardOffer({ product }: { product: Product }) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);

  const isAvailable = product.stock && product.inventory > 0;

  const discountPercent = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <article className="w-full h-full bg-gradient-to-b from-amber-50/30 to-white border border-amber-200/80 rounded-[1.5rem] overflow-hidden hover:shadow-lg hover:border-amber-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between p-3 relative group" onClick={() => router.push(routes.product(product.slug))}>
      {/* Discount Tag Top Left */}
      {discountPercent > 0 && (
        <span className="absolute top-0 left-3 z-10 bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-b-md shadow-sm uppercase tracking-wide">
          SAVE {discountPercent}%
        </span>
      )}

      {/* Image box */}
      <div className="relative aspect-square w-full bg-white rounded-2xl overflow-hidden flex items-center justify-center mt-2 border border-neutral-50 shadow-inner">
        <Img product={product} radius="16px" />

        {/* Heart */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-neutral-400 hover:text-red-500 hover:bg-white shadow-sm border border-neutral-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className={isWishlisted ? "text-red-500" : ""}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Stock status tag */}
        {!isAvailable ? (
          <span className="absolute top-2 left-2 z-10 rounded bg-red-650 bg-red-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 uppercase">
            Sold Out
          </span>
        ) : product.inventory < 5 ? (
          <span className="absolute top-2 left-2 z-10 rounded bg-amber-500 text-neutral-950 font-extrabold text-[8px] px-1.5 py-0.5 uppercase">
            Only {product.inventory}
          </span>
        ) : null}

        {/* 15m label */}
        {isAvailable && (
          <span className="absolute bottom-2 right-2 z-10 bg-emerald-600 text-white font-bold text-[7.5px] px-1.5 py-0.5 rounded shadow-sm">
            ⚡ 15 MINS
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-left flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-semibold text-neutral-400 block truncate">{product.unit}</span>
          <h3 className="font-bold text-neutral-800 text-[13px] leading-tight line-clamp-2 min-h-[32px]">{product.name}</h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-50/60" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <span className="font-black text-amber-600 text-sm">₹{product.price}</span>
            {product.mrp && (
              <s className="text-[9.5px] text-neutral-400 font-semibold leading-none">₹{product.mrp}</s>
            )}
          </div>

          {!isAvailable ? (
            <button className="h-7 px-2 bg-neutral-50 text-neutral-400 text-[9px] font-bold border border-neutral-100 rounded-lg cursor-not-allowed" disabled>
              Unavailable
            </button>
          ) : (
            <AddOrVariant product={product} size="sm" />
          )}
        </div>
      </div>
    </article>
  );
}

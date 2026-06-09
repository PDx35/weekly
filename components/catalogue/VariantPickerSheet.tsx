'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Img } from '@/components/ui/Img';
import { Price } from '@/components/ui/Price';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/store/cart';
import type { Product } from '@/lib/types';

interface PickerOption {
  id: string;
  label: string;
  price: number;
  mrp: number | null;
  stock: boolean;
  inventory: number;
}

/**
 * Bottom-sheet (mobile) / centered modal (desktop) that lets the shopper pick a
 * pack-size variant and add it to the cart, without leaving the listing. Each
 * option carries its own quantity, keyed by the variant id — matching how the
 * cart and product page resolve variants. Rendered via a portal so it overlays
 * the page and never triggers the card's navigate-on-click.
 */
export function VariantPickerSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { cart, setQty, showToast } = useCart();

  // Base product + its variants, mirroring the product page's option list.
  const options = useMemo<PickerOption[]>(() => {
    const base: PickerOption = {
      id: product.id,
      label: product.unit || 'Default',
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      inventory: product.inventory,
    };
    const variants = (product.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock,
      inventory: v.inventory,
    }));
    return [base, ...variants];
  }, [product]);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const change = (opt: PickerOption, q: number) => {
    if (q > opt.inventory) {
      showToast(`Only ${opt.inventory} units of ${product.name} (${opt.label}) are available.`);
      return;
    }
    setQty(opt.id, q);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Choose a pack size for ${product.name}`}
        className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
            <Img product={product} radius="12px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
              Select pack size
            </p>
            <h3 className="truncate text-sm font-bold text-neutral-900">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {options.map((opt) => {
            const qty = cart[opt.id] || 0;
            const available = opt.stock && opt.inventory > 0;
            return (
              <div
                key={opt.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3 transition-colors hover:bg-neutral-50/60 [&:not(:last-child)]:mb-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-800">{opt.label}</p>
                  <Price value={opt.price} mrp={opt.mrp} size="sm" />
                </div>
                {available ? (
                  <QtyStepper qty={qty} size="sm" onChange={(q) => change(opt, q)} />
                ) : (
                  <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-400">
                    Out of stock
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 pt-0">
          <button
            onClick={onClose}
            className="h-11 w-full rounded-xl bg-emerald-600 font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.99]"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

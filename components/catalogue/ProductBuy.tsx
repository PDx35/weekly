'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import type { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/store/cart';

interface SelectableOption {
  id: string;
  label: string;
  price: number;
  mrp: number | null;
  stock: boolean;
  inventory: number;
}

/** Quantity stepper + add-to-cart / go-to-cart action for the product page. */
export function ProductBuy({ product }: { product: Product }) {
  const router = useRouter();
  const { cart, setQty, showToast, setActiveVariant } = useCart();

  const options = useMemo<SelectableOption[]>(() => {
    const baseOption: SelectableOption = {
      id: product.id,
      label: product.unit,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      inventory: product.inventory,
    };
    return product.variants && product.variants.length > 0
      ? [baseOption, ...product.variants]
      : [baseOption];
  }, [product]);

  const [selectedOption, setSelectedOption] = useState<SelectableOption>(options[0]);

  // Reset selected option when product changes
  useEffect(() => {
    setSelectedOption(options[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    setActiveVariant({
      id: selectedOption.id,
      label: selectedOption.label,
      price: selectedOption.price,
      mrp: selectedOption.mrp,
      stock: selectedOption.stock,
      inventory: selectedOption.inventory,
      name: selectedOption.id === product.id ? product.name : `${product.name} - ${selectedOption.label}`,
    });
    return () => {
      setActiveVariant(null);
    };
  }, [selectedOption, product.name, product.id, setActiveVariant]);

  const qty = cart[selectedOption.id] || 0;
  const isAvailable = selectedOption.stock && selectedOption.inventory > 0;

  const handleQtyChange = (q: number) => {
    if (q > selectedOption.inventory) {
      showToast(`Only ${selectedOption.inventory} units of ${product.name} (${selectedOption.label}) are available.`);
      return;
    }
    setQty(selectedOption.id, q);
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* 1. Unit/Label */}
      <div className="pd-unit">{selectedOption.label}</div>

      {/* 2. Rating & Stock Status */}
      <div className="pd-rate">
        <Rating value={product.rating} reviews={product.reviews} size={16} />
        <span className="pd-instock">
          {isAvailable ? (
            <>
              <Icon name="check" size={14} /> In stock
            </>
          ) : (
            <span style={{ color: '#c2410c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="info" size={14} /> Out of stock
            </span>
          )}
        </span>
      </div>

      {/* 3. Price Display */}
      <div>
        <Price value={selectedOption.price} mrp={selectedOption.mrp} size="lg" />
        <p className="pd-tax">Inclusive of all taxes</p>
      </div>

      {/* 4. Variant Selector */}
      {options.length > 1 && (
        <div className="pd-variants">
          <span className="pd-variants-title">Pack Size</span>
          <div className="pd-variants-list">
            {options.map((opt) => {
              const optAvailable = opt.stock && opt.inventory > 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`pd-variant-chip ${selectedOption.id === opt.id ? 'active' : ''} ${!optAvailable ? 'out-of-stock' : ''}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Stepper & Cart Button */}
      <div className="pd-buy">
        {isAvailable ? (
          <>
            <QtyStepper qty={qty} onChange={handleQtyChange} />
            <Button
              size="lg"
              full
              icon="cart"
              onClick={() => {
                if (!qty) {
                  handleQtyChange(1);
                } else {
                  router.push(routes.cart());
                }
              }}
            >
              {qty ? 'Go to cart' : 'Add to cart'}
            </Button>
          </>
        ) : (
          <Button size="lg" full disabled className="bg-neutral-100 text-neutral-450 border border-neutral-200">
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductUnit({ product }: { product: Product }) {
  const { activeVariant } = useCart();
  const label = activeVariant?.label || product.unit;
  return <b>{label}</b>;
}

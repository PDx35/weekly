'use client';

import { Icon } from './Icon';

interface QtyStepperProps {
  /** Current quantity; `0`/undefined shows the "Add" button. */
  qty: number;
  /** Called with the new quantity when +/- is pressed. */
  onChange: (qty: number) => void;
  size?: 'sm' | 'md';
}

/** Add button that turns into a −/+ quantity stepper once `qty > 0`. */
export function QtyStepper({ qty, onChange, size = 'md' }: QtyStepperProps) {
  if (!qty) {
    return (
      <button className={`qty-add qty-${size}`} onClick={() => onChange(1)}>
        <Icon name="plus" size={size === 'sm' ? 15 : 17} /> Add
      </button>
    );
  }
  return (
    <div className={`qty qty-${size}`}>
      <button onClick={() => onChange(qty - 1)} aria-label="Decrease">
        <Icon name="minus" size={15} />
      </button>
      <span>{qty}</span>
      <button onClick={() => onChange(qty + 1)} aria-label="Increase">
        <Icon name="plus" size={15} />
      </button>
    </div>
  );
}

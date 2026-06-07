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
      <button 
        className={`qty-add qty-${size} border border-emerald-600 hover:bg-emerald-50 hover:border-emerald-700 text-emerald-700 font-extrabold rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center`} 
        onClick={() => onChange(1)}
      >
        <span className="text-emerald-700 mr-1.5 text-base font-black">+</span> ADD
      </button>
    );
  }
  return (
    <div className={`qty qty-${size} flex items-center justify-between border border-emerald-600 bg-emerald-600 text-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-out scale-100 hover:scale-[1.02]`}>
      <button 
        onClick={() => onChange(qty - 1)} 
        aria-label="Decrease"
        className="flex items-center justify-center font-black transition-colors duration-150 hover:bg-emerald-750 text-white h-full"
        style={{ width: size === 'sm' ? '30px' : '38px' }}
      >
        <span className="text-lg font-black select-none">−</span>
      </button>
      <span className="font-extrabold select-none transition-all duration-200 px-1 text-sm text-center" style={{ minWidth: '16px' }}>{qty}</span>
      <button 
        onClick={() => onChange(qty + 1)} 
        aria-label="Increase"
        className="flex items-center justify-center font-black transition-colors duration-150 hover:bg-emerald-750 text-white h-full"
        style={{ width: size === 'sm' ? '30px' : '38px' }}
      >
        <span className="text-lg font-black select-none">+</span>
      </button>
    </div>
  );
}

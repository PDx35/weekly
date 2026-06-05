'use client';

import { Icon } from '@/components/ui/Icon';
import type { Address } from '@/lib/types';

interface AddressCardProps {
  a: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
}

/** Selectable saved-address card with an edit affordance. */
export function AddressCard({ a, selected, onSelect, onEdit }: AddressCardProps) {
  return (
    <button className={`addr-card ${selected ? 'on' : ''}`} onClick={onSelect}>
      <span className="addr-radio">{selected && <Icon name="check" size={14} />}</span>
      <div className="addr-body">
        <div className="addr-top">
          <b>{a.label}</b>
          <span className="addr-type">{a.type}</span>
          {a.def && <span className="addr-def">Default</span>}
        </div>
        <p>
          {a.name} · {a.phone}
        </p>
        <p>
          {a.line1}, {a.line2}, {a.city} – {a.pin}
        </p>
      </div>
      <span
        className="addr-edit"
        role="button"
        tabIndex={0}
        aria-label="Edit address"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
      >
        <Icon name="edit" size={16} />
      </span>
    </button>
  );
}

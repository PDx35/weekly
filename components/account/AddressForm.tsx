'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import type { Address } from '@/lib/types';

/** Address fields captured by the form (id/default handled by the store). */
export type AddressDraft = Omit<Address, 'id' | 'def'>;

interface AddressFormProps {
  initial?: Address | null;
  onSave: (draft: AddressDraft) => void;
  onCancel?: () => void;
}

const TYPES: Address['type'][] = ['home', 'work', 'other'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const isPin = (v: string) => /^\d{6}$/.test(v.trim());
const isPhone = (v: string) => /^\+?\d[\d\s-]{7,14}$/.test(v.trim());

/** Add/edit address form with pincode and phone validation. */
export function AddressForm({ initial, onSave, onCancel }: AddressFormProps) {
  const [f, setF] = useState<AddressDraft>(
    initial ?? {
      label: 'Home',
      name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      pin: '',
      type: 'home',
    },
  );
  const set = (k: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  const pinValid = isPin(f.pin);
  const phoneValid = isPhone(f.phone);
  const valid = Boolean(f.name && f.line1 && f.city) && pinValid && phoneValid;

  return (
    <div className="addr-form">
      <div className="addr-types">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip ${f.type === t ? 'chip-on' : ''}`}
            onClick={() => setF({ ...f, type: t, label: cap(t) })}
          >
            <Icon name={t === 'work' ? 'pkg' : t === 'home' ? 'home' : 'pin'} size={14} /> {cap(t)}
          </button>
        ))}
      </div>
      <div className="field-grid">
        <Field label="Full name" value={f.name} onChange={set('name')} />
        <Field
          label="Phone number"
          value={f.phone}
          onChange={set('phone')}
          placeholder="+91 98765 43210"
          inputMode="tel"
          hint={f.phone && !phoneValid ? 'Enter a valid phone number' : undefined}
        />
        <Field label="Flat / House no. & building" value={f.line1} onChange={set('line1')} wide />
        <Field label="Area / Street / Landmark" value={f.line2} onChange={set('line2')} wide />
        <Field label="City" value={f.city} onChange={set('city')} />
        <Field
          label="PIN code"
          value={f.pin}
          onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          inputMode="numeric"
          hint={f.pin && !pinValid ? 'PIN must be 6 digits' : undefined}
        />
      </div>
      <div className="addr-form-actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button disabled={!valid} onClick={() => onSave(f)}>
          Save address
        </Button>
      </div>
    </div>
  );
}

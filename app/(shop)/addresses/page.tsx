'use client';

import { useState } from 'react';
import { AddressCard } from '@/components/account/AddressCard';
import { AddressForm, type AddressDraft } from '@/components/account/AddressForm';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Crumbs } from '@/components/ui/Crumbs';
import { Empty } from '@/components/ui/Empty';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import type { Address } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

function AddressesContent() {
  const { addresses, selectedAddr, upsertAddress, deleteAddress, setSelectedAddr } = useAuth();
  const { showToast } = useCart();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = async (draft: AddressDraft) => {
    await upsertAddress(editing ? { ...editing, ...draft } : { ...draft, id: '', def: false });
    showToast('Address saved');
    closeForm();
  };

  const select = async (a: Address) => {
    await setSelectedAddr(a.id);
    showToast(`Delivering to ${a.label}`);
  };

  const remove = async (a: Address) => {
    await deleteAddress(a.id);
    showToast('Address removed');
  };

  return (
    <div className="page addresses">
      <Crumbs items={[{ label: 'Home', href: routes.home() }, { label: 'Addresses' }]} />
      <div className="page-title-row">
        <h1 className="page-title">Saved addresses</h1>
        {!adding && (
          <Button
            icon="plus"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            Add address
          </Button>
        )}
      </div>

      {adding ? (
        <div className="co-block">
          <h2>{editing ? 'Edit address' : 'New address'}</h2>
          <AddressForm initial={editing} onCancel={closeForm} onSave={save} />
        </div>
      ) : addresses.length === 0 ? (
        <Empty icon="pin" title="No saved addresses" sub="Add an address to speed up checkout.">
          <Button
            icon="plus"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            Add address
          </Button>
        </Empty>
      ) : (
        <div className="addr-list addr-list-page">
          {addresses.map((a) => (
            <div className="addr-manage" key={a.id}>
              <AddressCard
                a={a}
                selected={selectedAddr === a.id}
                onSelect={() => select(a)}
                onEdit={() => {
                  setEditing(a);
                  setAdding(true);
                }}
              />
              <button className="addr-remove" onClick={() => remove(a)}>
                <Icon name="trash" size={15} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireAuth>
      <AddressesContent />
    </RequireAuth>
  );
}

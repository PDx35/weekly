'use client';

/**
 * Auth + profile context shell (Sprint 0).
 *
 * Holds the signed-in user, saved addresses, and the selected delivery address.
 * This is an in-memory shell: Sprint 2 wires it to Firebase Auth
 * (`onAuthStateChanged`) and persists addresses to `users/{uid}/addresses`.
 * Addresses are seeded from sample data so the header location picker renders.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { sampleAddresses } from '@/lib/data';
import type { Address, User } from '@/lib/types';

interface AuthContextValue {
  /** Signed-in user, or `null` for a guest. */
  user: User | null;
  setUser: (user: User | null) => void;
  /** Saved delivery addresses. */
  addresses: Address[];
  /** Id of the currently selected delivery address. */
  selectedAddr: string | null;
  setSelectedAddr: (id: string | null) => void;
  /** Add a new address or update an existing one by id. */
  upsertAddress: (addr: Address) => void;
  /** Remove an address by id. */
  deleteAddress: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(sampleAddresses);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(
    sampleAddresses.find((a) => a.def)?.id ?? null,
  );

  const upsertAddress = useCallback((addr: Address) => {
    setAddresses((list) =>
      list.some((a) => a.id === addr.id)
        ? list.map((a) => (a.id === addr.id ? { ...a, ...addr } : a))
        : [...list, addr],
    );
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      addresses,
      selectedAddr,
      setSelectedAddr,
      upsertAddress,
      deleteAddress,
    }),
    [user, addresses, selectedAddr, upsertAddress, deleteAddress],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. Throws if used outside {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

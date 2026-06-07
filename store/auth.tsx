'use client';

/**
 * Auth + profile context (Sprint 2).
 *
 * Wraps Firebase Auth (`onAuthStateChanged`) and persists the profile to the
 * live `users/{uid}` doc, matching the existing app's schema: addresses live in
 * an `addresses` array on the doc with a `defaultAddressId` pointer (see
 * docs/current_db.md). `selectedAddr` mirrors `defaultAddressId`.
 *
 * Never writes user docs from an unauthenticated context — every mutation is
 * guarded on a signed-in `user`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { Address, User } from '@/lib/types';

/** Address as stored in the user doc (default is tracked separately). */
type StoredAddress = Omit<Address, 'def'>;

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextValue {
  /** Signed-in user, or `null` for a guest. */
  user: User | null;
  /** True until the initial auth state has resolved. */
  loading: boolean;
  /** Saved delivery addresses (with `def` derived from the default pointer). */
  addresses: Address[];
  /** Id of the default/selected delivery address. */
  selectedAddr: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (input: RegisterInput) => Promise<void>;
  signInGoogle: () => Promise<void>;
  /** Starts phone OTP (invisible reCAPTCHA). Resolve the returned object with `.confirm(code)`. */
  signInWithPhone: (phone: string) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
  /** Add or update an address (persists to Firestore). */
  upsertAddress: (addr: Address) => Promise<void>;
  /** Remove an address by id. */
  deleteAddress: (id: string) => Promise<void>;
  /** Set the default/selected delivery address. */
  setSelectedAddr: (id: string) => Promise<void>;
  /** Update user profile details. */
  updateUserProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddrState] = useState<string | null>(null);

  // Name/phone captured at registration, consumed when the user doc is created
  // (avoids a race with onAuthStateChanged firing before the doc is written).
  const pendingProfile = useRef<{ name?: string; phone?: string }>({});
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  /** Create the users/{uid} doc on first sign-in if it's missing. */
  const ensureUserDoc = useCallback(async (fb: FirebaseUser) => {
    const ref = doc(db, 'users', fb.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: pendingProfile.current.name ?? fb.displayName ?? '',
        email: fb.email ?? '',
        phone: pendingProfile.current.phone ?? fb.phoneNumber ?? '',
        photoUrl: fb.photoURL ?? null,
        addresses: [],
        defaultAddressId: '',
        createdAt: serverTimestamp(),
      });
    }
    return ref;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      if (!fb) {
        setUser(null);
        setAddresses([]);
        setSelectedAddrState(null);
        setLoading(false);
        return;
      }
      try {
        const ref = await ensureUserDoc(fb);
        const snap = await getDoc(ref);
        const data = snap.data() ?? {};
        setUser({
          uid: fb.uid,
          name: (data.name as string) || fb.displayName || '',
          email: (data.email as string) || fb.email || '',
          phone: (data.phone as string) || fb.phoneNumber || '',
          photoUrl: (data.photoUrl as string | null) ?? fb.photoURL ?? null,
        });
        const stored = (data.addresses as StoredAddress[] | undefined) ?? [];
        const defId = (data.defaultAddressId as string) || stored[0]?.id || '';
        setAddresses(stored.map((a) => ({ ...a, def: a.id === defId })));
        setSelectedAddrState(defId || null);
      } catch {
        // Firestore read failed (e.g. rules) — fall back to the auth profile.
        setUser({
          uid: fb.uid,
          name: fb.displayName ?? '',
          email: fb.email ?? '',
          phone: fb.phoneNumber ?? '',
          photoUrl: fb.photoURL ?? null,
        });
        setAddresses([]);
        setSelectedAddrState(null);
      } finally {
        pendingProfile.current = {};
        setLoading(false);
      }
    });
    return () => unsub();
  }, [ensureUserDoc]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerEmail = useCallback(async ({ name, email, phone, password }: RegisterInput) => {
    pendingProfile.current = { name, phone };
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
  }, []);

  const signInGoogle = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    recaptchaRef.current?.clear();
    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, { size: 'invisible' });
    recaptchaRef.current = verifier;
    try {
      return await signInWithPhoneNumber(auth, phone, verifier);
    } catch (err) {
      verifier.clear();
      recaptchaRef.current = null;
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  /** Persist the addresses array + default pointer to the user doc. */
  const persist = useCallback(async (uid: string, list: Address[], defaultId: string) => {
    const stored: StoredAddress[] = list.map(
      ({ id, label, name, phone, line1, line2, city, pin, type }) => ({
        id,
        label,
        name,
        phone,
        line1,
        line2,
        city,
        pin,
        type,
      }),
    );
    await updateDoc(doc(db, 'users', uid), { addresses: stored, defaultAddressId: defaultId });
  }, []);

  const upsertAddress = useCallback(
    async (addr: Address) => {
      if (!user) return;
      const exists = Boolean(addr.id) && addresses.some((a) => a.id === addr.id);
      let defId = selectedAddr ?? '';
      let next: Address[];
      if (exists) {
        next = addresses.map((a) => (a.id === addr.id ? { ...a, ...addr } : a));
      } else {
        const id = addr.id || 'a' + Date.now();
        next = [...addresses, { ...addr, id }];
        if (!defId) defId = id;
      }
      next = next.map((a) => ({ ...a, def: a.id === defId }));
      await persist(user.uid, next, defId);
      setAddresses(next);
      setSelectedAddrState(defId || null);
    },
    [user, addresses, selectedAddr, persist],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!user) return;
      let defId = selectedAddr ?? '';
      let next = addresses.filter((a) => a.id !== id);
      if (defId === id) defId = next[0]?.id ?? '';
      next = next.map((a) => ({ ...a, def: a.id === defId }));
      await persist(user.uid, next, defId);
      setAddresses(next);
      setSelectedAddrState(defId || null);
    },
    [user, addresses, selectedAddr, persist],
  );

  const setSelectedAddr = useCallback(
    async (id: string) => {
      if (!user) return;
      const next = addresses.map((a) => ({ ...a, def: a.id === id }));
      await persist(user.uid, next, id);
      setAddresses(next);
      setSelectedAddrState(id);
    },
    [user, addresses, persist],
  );

  const updateUserProfile = useCallback(
    async (updates: { name?: string; phone?: string }) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, updates);
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      addresses,
      selectedAddr,
      signInEmail,
      registerEmail,
      signInGoogle,
      signInWithPhone,
      signOut,
      upsertAddress,
      deleteAddress,
      setSelectedAddr,
      updateUserProfile,
    }),
    [
      user,
      loading,
      addresses,
      selectedAddr,
      signInEmail,
      registerEmail,
      signInGoogle,
      signInWithPhone,
      signOut,
      upsertAddress,
      deleteAddress,
      setSelectedAddr,
      updateUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. Throws if used outside {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

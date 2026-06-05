'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/store/auth';

interface AdminState {
  /** True once confirmed the user has an /admins/{uid} doc. */
  isAdmin: boolean;
  /** Still resolving auth or the admin check. */
  checking: boolean;
  /** Whether anyone is signed in at all. */
  signedIn: boolean;
}

/** Resolve whether the current user is an admin (member of /admins). */
export function useAdmin(): AdminState {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        if (active) setIsAdmin(snap.exists());
      } catch {
        if (active) setIsAdmin(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loading]);

  return {
    isAdmin: isAdmin === true,
    checking: loading || isAdmin === null,
    signedIn: Boolean(user),
  };
}

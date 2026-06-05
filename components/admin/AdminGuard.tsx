'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/admin/useAdmin';

/** Gate admin pages: only members of /admins may pass; others go to login. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, checking } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!checking && !isAdmin) router.replace('/admin/login');
  }, [checking, isAdmin, router]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50 text-sm text-neutral-500">
        Checking admin access…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50 text-sm text-neutral-500">
        Redirecting to sign in…
      </div>
    );
  }
  return <>{children}</>;
}

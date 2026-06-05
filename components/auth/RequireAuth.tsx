'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Empty } from '@/components/ui/Empty';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';

/**
 * Client-side route guard. Renders `children` only for signed-in users;
 * otherwise redirects to /auth with a `next` return path. Shows a loading
 * state while the initial auth check resolves (avoids redirecting too early).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`${routes.auth()}?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="page">
        <Empty icon="user" title="Loading…" sub="Checking your session." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <Empty icon="user" title="Please sign in" sub="Redirecting you to the login page…" />
      </div>
    );
  }

  return <>{children}</>;
}

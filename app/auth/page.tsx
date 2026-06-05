import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * Auth route. Renders chrome-free (outside the `(shop)` group). The screen is a
 * client component using `useSearchParams`, so it's wrapped in Suspense.
 */
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth" />}>
      <AuthScreen />
    </Suspense>
  );
}

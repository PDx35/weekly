'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminButton, AdminInput, Labeled } from '@/components/admin/ui';
import { useAdmin } from '@/lib/admin/useAdmin';
import { useAuth } from '@/store/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signInEmail, signOut } = useAuth();
  const { isAdmin, checking, signedIn } = useAdmin();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!checking && isAdmin) router.replace('/admin');
  }, [checking, isAdmin, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await signInEmail(email, pass);
      // Admin check runs reactively; the effect redirects admins to /admin.
    } catch {
      setErr('Incorrect email or password.');
      setBusy(false);
    }
  };

  const notAuthorised = signedIn && !checking && !isAdmin;

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-1 text-xl font-bold">
          Weekly<span className="text-emerald-600">Market</span> Admin
        </div>
        <p className="mb-5 text-sm text-neutral-500">Sign in with your admin account.</p>

        {notAuthorised ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              This account isn’t an admin. Use an admin account, or contact a super admin.
            </p>
            <AdminButton
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await signOut();
                setBusy(false);
              }}
            >
              Sign out
            </AdminButton>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Labeled label="Email">
              <AdminInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@freshmart.in"
                required
              />
            </Labeled>
            <Labeled label="Password">
              <AdminInput
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Labeled>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <AdminButton type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </AdminButton>
          </form>
        )}
      </div>
    </div>
  );
}

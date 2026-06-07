'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminButton, AdminInput, Labeled } from '@/components/admin/ui';

export default function AdminRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, secret: '' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess(true);
      setBusy(false);
    } catch (err: unknown) {
      setErr(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 p-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-1 text-xl font-bold">
          fresh<span className="text-emerald-600">mart</span> Admin
        </div>
        <p className="mb-5 text-sm text-neutral-500">Register a new admin account.</p>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 text-sm">Success!</h3>
              <p className="text-emerald-700 text-xs mt-1">
                Admin account registered successfully. You can now sign in.
              </p>
            </div>
            <Link href="/admin/login" className="block">
              <AdminButton className="w-full">Go to Admin Login</AdminButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Labeled label="Full Name">
              <AdminInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={busy}
              />
            </Labeled>
            <Labeled label="Email">
              <AdminInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@freshmart.in"
                required
                disabled={busy}
              />
            </Labeled>
            <Labeled label="Password">
              <AdminInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={busy}
                minLength={6}
              />
            </Labeled>
            {err && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{err}</p>}
            <AdminButton type="submit" className="w-full" disabled={busy}>
              {busy ? 'Registering…' : 'Register'}
            </AdminButton>

            <div className="text-center mt-4 text-xs text-neutral-500">
              Already have an admin account?{' '}
              <Link href="/admin/login" className="text-emerald-600 hover:underline font-medium">
                Log in here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

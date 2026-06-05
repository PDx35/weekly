'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ConfirmationResult } from 'firebase/auth';
import { Logo } from '@/components/chrome/Logo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

type Mode = 'login' | 'register' | 'phone';

/** Map Firebase auth error codes to friendly messages. */
function authError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number with country code (e.g. +91…).';
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Please try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/** Login / register / phone-OTP screen wired to Firebase Auth. */
export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInEmail, registerEmail, signInGoogle, signInWithPhone } = useAuth();
  const { showToast } = useCart();

  const nextParam = searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : routes.home();

  const [mode, setMode] = useState<Mode>('login');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', pass: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  // Phone OTP state.
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  // Redirect once authenticated (covers email, Google, and phone flows).
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const valid =
    mode === 'login'
      ? Boolean(f.email && f.pass)
      : Boolean(f.name && f.email && f.phone && f.pass.length >= 6);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInEmail(f.email, f.pass);
        showToast('Welcome back!');
      } else {
        await registerEmail({ name: f.name, email: f.email, phone: f.phone, password: f.pass });
        showToast('Account created — welcome!');
      }
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInGoogle();
      showToast('Welcome!');
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (!phone.trim() || busy) return;
    setBusy(true);
    try {
      const result = await signInWithPhone(phone.trim());
      setConfirmation(result);
      showToast('Code sent via SMS');
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmation || code.trim().length < 6 || busy) return;
    setBusy(true);
    try {
      await confirmation.confirm(code.trim());
      showToast('Phone verified — welcome!');
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <Logo onClick={() => router.push(routes.home())} />
        <div className="auth-art-mid">
          <h2>
            Fresh groceries,
            <br />
            delivered in 30 minutes.
          </h2>
          <p>
            Join thousands of households getting farm-fresh produce at honest prices, right to their
            door.
          </p>
          <ul className="auth-points">
            <li>
              <Icon name="truck" size={18} /> Lightning-fast 30-minute delivery
            </li>
            <li>
              <Icon name="leaf" size={18} /> Handpicked &amp; quality-checked daily
            </li>
            <li>
              <Icon name="shield" size={18} /> Not fresh? Instant refund
            </li>
          </ul>
        </div>
        <Img
          label="fresh produce"
          ratio="16 / 7"
          cat={{ tint: 'rgba(255,255,255,.16)', ink: 'rgba(255,255,255,.85)' }}
          radius="18px"
        />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          {mode === 'phone' ? (
            <>
              <h1>Sign in with phone</h1>
              <p className="auth-sub">
                {confirmation
                  ? `Enter the 6-digit code sent to ${phone}.`
                  : "We'll text you a one-time code."}
              </p>
              {!confirmation ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendCode();
                  }}
                >
                  <Field
                    label="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    wide
                  />
                  <Button
                    size="lg"
                    full
                    type="submit"
                    disabled={!phone.trim() || busy}
                    iconRight="arrowR"
                  >
                    Send code
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyCode();
                  }}
                >
                  <Field
                    label="Verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    wide
                  />
                  <Button
                    size="lg"
                    full
                    type="submit"
                    disabled={code.trim().length < 6 || busy}
                    iconRight="arrowR"
                  >
                    Verify &amp; continue
                  </Button>
                </form>
              )}
              <button
                className="auth-skip"
                onClick={() => {
                  setMode('login');
                  setConfirmation(null);
                  setCode('');
                }}
              >
                <Icon name="back" size={15} /> Back to log in
              </button>
            </>
          ) : (
            <>
              <div className="auth-tabs">
                <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
                  Log in
                </button>
                <button
                  className={mode === 'register' ? 'on' : ''}
                  onClick={() => setMode('register')}
                >
                  Create account
                </button>
              </div>
              <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
              <p className="auth-sub">
                {mode === 'login'
                  ? 'Log in to continue shopping.'
                  : 'It only takes a minute to get started.'}
              </p>

              <form onSubmit={submit}>
                {mode === 'register' && (
                  <Field
                    label="Full name"
                    value={f.name}
                    onChange={set('name')}
                    placeholder="Aarav Sharma"
                    wide
                  />
                )}
                <Field
                  label="Email address"
                  type="email"
                  value={f.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  wide
                />
                {mode === 'register' && (
                  <Field
                    label="Phone number"
                    value={f.phone}
                    onChange={set('phone')}
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    wide
                  />
                )}
                <label className="field field-wide">
                  <span>Password</span>
                  <span className="field-pass">
                    <input
                      type={show ? 'text' : 'password'}
                      value={f.pass}
                      onChange={set('pass')}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label="Toggle password"
                    >
                      <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
                    </button>
                  </span>
                </label>
                {mode === 'login' && (
                  <button type="button" className="auth-forgot">
                    Forgot password?
                  </button>
                )}
                <Button size="lg" full type="submit" disabled={!valid || busy} iconRight="arrowR">
                  {mode === 'login' ? 'Log in' : 'Create account'}
                </Button>
              </form>

              <div className="auth-or">
                <span>or continue with</span>
              </div>
              <div className="auth-social">
                <button onClick={google} disabled={busy}>
                  Google
                </button>
                <button onClick={() => showToast('Apple sign-in is coming soon')} disabled={busy}>
                  Apple
                </button>
                <button onClick={() => setMode('phone')} disabled={busy}>
                  Phone OTP
                </button>
              </div>

              <button className="auth-skip" onClick={() => router.push(routes.home())}>
                Skip for now — browse as guest <Icon name="arrowR" size={15} />
              </button>
              <p className="auth-terms">
                By continuing you agree to FreshMart&apos;s Terms of Service &amp; Privacy Policy.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Invisible reCAPTCHA mount point for phone OTP. */}
      <div id="recaptcha-container" />
    </div>
  );
}

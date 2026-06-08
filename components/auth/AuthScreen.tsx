'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ConfirmationResult } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';

type Step = 'phone' | 'otp' | 'onboarding';

function authError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-verification-code':
      return 'Incorrect verification code. Please try again.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number (e.g. +91 98765 43210).';
    case 'auth/too-many-requests':
      return 'Too many verification attempts. Please try again later.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again tomorrow.';
    default:
      return 'Authentication failed. Please check details and try again.';
  }
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInGoogle, signInWithPhone, updateUserProfile } = useAuth();
  const { showToast } = useCart();

  const nextParam = searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : routes.home();

  // Navigation steps
  const [step, setStep] = useState<Step>('phone');
  const [busy, setBusy] = useState(false);
  const [successChecked, setSuccessChecked] = useState(false);

  // Phone number state
  const [phone, setPhone] = useState('');
  
  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  
  // Timer state
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Onboarding state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Handle auto redirection for logged-in users with valid profile names
  useEffect(() => {
    if (!loading && user) {
      if (!user.name) {
        setStep('onboarding');
      } else {
        router.replace(next);
      }
    }
  }, [loading, user, next, router]);

  // Timer countdown
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, timer]);

  // Handle digit changes for the OTP input blocks
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanVal;
    setOtpDigits(updated);

    // Auto-focus next input field
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[index] = '';
        setOtpDigits(updated);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Actions
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const formattedPhone = phone.trim();
    if (!formattedPhone || busy) return;
    
    // Simple verification helper for +code
    if (!formattedPhone.startsWith('+')) {
      showToast('Please include your country code (e.g. +91 98765 43210)');
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithPhone(formattedPhone);
      setConfirmation(result);
      setTimer(30);
      setStep('otp');
      showToast('OTP code sent successfully!');
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otpDigits.join('');
    if (!confirmation || code.length < 6 || busy) return;

    setBusy(true);
    try {
      await confirmation.confirm(code);
      setSuccessChecked(true);
      showToast('Phone verified successfully!');
      
      // Delay to show green checkmark success animation
      setTimeout(() => {
        setSuccessChecked(false);
        // Step redirect will be evaluated by user name hook
      }, 1200);
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || busy) return;
    setOtpDigits(['', '', '', '', '', '']);
    await handleSendOtp();
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || busy) return;

    setBusy(true);
    try {
      await updateUserProfile({ name: fullName.trim(), phone });
      showToast('Welcome to Weekly Market!');
      router.replace(next);
    } catch (err) {
      showToast('Failed to complete onboarding. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInGoogle();
      showToast('Welcome to Weekly Market!');
    } catch (err) {
      showToast(authError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex items-center justify-center font-sans text-neutral-900 selection:bg-emerald-100">
      {/* CSS Layout resets to hide default layouts */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .app > .hdr,
          .app > .mobtop,
          .app > .footer {
            display: none !important;
          }
          .main {
            padding: 0 !important;
            max-width: 100% !important;
            background: transparent !important;
          }
        `
      }} />

      {/* Desktop / Large Screen Split Panel */}
      <div className="w-full max-w-6xl mx-auto lg:p-6 grid lg:grid-cols-12 overflow-hidden lg:rounded-[2.5rem] lg:bg-white lg:border lg:border-neutral-100 lg:shadow-xl lg:shadow-neutral-100/60 min-h-[600px]">
        
        {/* Left Side branding and features banner (Desktop only) */}
        <section className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 text-white p-12 flex-col justify-between relative overflow-hidden rounded-[2rem]">
          {/* Subtle vectors */}
          <span className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/5"></span>
          <span className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-800/20"></span>
          
          <div 
            onClick={() => router.push(routes.home())}
            className="flex items-center gap-2 text-2xl font-bold tracking-tight cursor-pointer shrink-0 z-10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </span>
            <span>Weekly <span className="text-amber-400 font-extrabold">Market</span></span>
          </div>

          <div className="space-y-6 z-10">
            <span className="inline-block rounded-full bg-emerald-800/60 border border-emerald-700/50 px-4 py-1 text-xs font-bold tracking-wider text-emerald-250 uppercase">
              15 MINUTE DELIVERY
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase !text-white">
              DELICIOUS &amp; FRESH GROCERIES AT YOUR DOOR.
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed max-w-md">
              Join thousands of happy households getting farm-fresh veggies, dairy products, and organic groceries delivered instantly.
            </p>
            
            <ul className="space-y-3.5 pt-2 text-sm font-semibold text-emerald-200">
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800/40 text-emerald-300">✓</span>
                <span>Lightning-fast express logistics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800/40 text-emerald-300">✓</span>
                <span>Farm-fresh handpicked veggies &amp; fruits</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800/40 text-emerald-300">✓</span>
                <span>Safe payments &amp; 100% satisfied refunds</span>
              </li>
            </ul>
          </div>

          <div className="text-[10px] text-emerald-300 font-medium z-10">
            © {new Date().getFullYear()} Weekly Market. Safe and secure authentic checkouts.
          </div>
        </section>

        {/* Right Side card form container */}
        <section className="lg:col-span-6 w-full flex flex-col justify-center px-6 sm:px-12 py-8 bg-white lg:bg-transparent">
          
          <div className="w-full max-w-md mx-auto space-y-8 relative">
            
            {/* Header logo / mobile logo */}
            <div className="flex justify-between items-center lg:hidden">
              <div 
                onClick={() => router.push(routes.home())}
                className="flex items-center gap-2 text-xl font-bold tracking-tight cursor-pointer"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </span>
                <span>Weekly <span className="text-emerald-600 font-extrabold">Market</span></span>
              </div>
              <button 
                onClick={() => router.push(routes.home())}
                className="text-xs text-neutral-400 font-bold hover:text-neutral-600"
              >
                Skip as Guest
              </button>
            </div>

            {/* STEP 1: ENTER PHONE NUMBER */}
            {step === 'phone' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">Welcome to Weekly Market</h1>
                  <p className="text-xs sm:text-sm text-neutral-455 font-medium">Verify your mobile number to start checkout or shopping</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Phone Number</label>
                    <div className="flex rounded-xl border border-neutral-200 focus-within:border-emerald-500 overflow-hidden bg-neutral-50/50 transition-all">
                      <span className="flex items-center px-4.5 bg-neutral-100/65 border-r border-neutral-200 text-sm font-bold text-neutral-500 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={phone.startsWith('+91') ? phone.slice(3) : phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val ? `+91${val}` : '');
                        }}
                        className="w-full px-4 py-3 text-sm font-bold bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <Button
                    size="lg"
                    full
                    type="submit"
                    disabled={phone.length < 13 || busy}
                    className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white rounded-xl py-3.5 text-xs shadow-md shadow-emerald-100 transition-all"
                  >
                    {busy ? 'Sending code...' : 'Continue'}
                  </Button>
                </form>

                <div className="relative flex py-2 items-center text-xs text-neutral-300 font-semibold uppercase tracking-wider select-none">
                  <div className="flex-grow border-t border-neutral-200/60"></div>
                  <span className="flex-shrink mx-4 text-neutral-400">or link with</span>
                  <div className="flex-grow border-t border-neutral-200/60"></div>
                </div>

                {/* Social logins */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGoogleSignIn} 
                    disabled={busy}
                    className="flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 py-2.5 rounded-xl text-xs font-bold text-neutral-700 transition-colors"
                  >
                    Google
                  </button>
                  <button 
                    onClick={() => showToast('Apple Sign In is coming soon')}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 py-2.5 rounded-xl text-xs font-bold text-neutral-700 transition-colors"
                  >
                    Apple
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY OTP CODE */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setStep('phone'); setConfirmation(null); }}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-50 border border-neutral-200"
                  >
                    <Icon name="back" size={14} className="text-neutral-600" />
                  </button>
                  <div>
                    <h1 className="text-lg font-black text-neutral-900 tracking-tight leading-none">Enter OTP</h1>
                    <p className="text-[10px] text-neutral-450 font-bold leading-none mt-1">Sent to {phone}</p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* Custom 6 numeric codes */}
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="h-12 w-12 rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-extrabold text-lg bg-neutral-50/50 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Button
                      size="lg"
                      full
                      type="submit"
                      disabled={otpDigits.join('').length < 6 || busy}
                      className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white rounded-xl py-3.5 text-xs shadow-md shadow-emerald-100 transition-all"
                    >
                      {busy ? 'Verifying OTP...' : 'Verify &amp; Continue'}
                    </Button>

                    <div className="flex justify-between items-center text-xs font-bold text-neutral-500 select-none">
                      <span>Haven&apos;t received?</span>
                      {timer > 0 ? (
                        <span className="text-neutral-400">Resend in {timer}s</span>
                      ) : (
                        <button 
                          type="button" 
                          onClick={handleResendOtp}
                          className="text-emerald-600 hover:text-emerald-750 font-extrabold underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: NEW USER ONBOARDING FORM */}
            {step === 'onboarding' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-neutral-900 tracking-tight leading-none">Almost there!</h1>
                  <p className="text-xs text-neutral-450 font-medium">Please set up your profile details to start delivery</p>
                </div>

                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <Button
                    size="lg"
                    full
                    type="submit"
                    disabled={!fullName.trim() || busy}
                    className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white rounded-xl py-3.5 text-xs shadow-md shadow-emerald-100 transition-all mt-2"
                  >
                    {busy ? 'Registering...' : 'Complete Registration'}
                  </Button>
                </form>
              </div>
            )}

            {/* Terms and Privacy policy statement */}
            <p className="text-[10px] text-neutral-400 font-semibold text-center leading-relaxed max-w-[280px] mx-auto select-none pt-4">
              By continuing, you agree to Weekly Market&apos;s <span className="underline hover:text-neutral-600 cursor-pointer">Terms of Service</span> &amp; <span className="underline hover:text-neutral-600 cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Invisible reCAPTCHA mount point */}
            <div id="recaptcha-container" />

          </div>
        </section>
      </div>

      {/* SUCCESS OVERLAY CHECKMARK ANIMATION */}
      {successChecked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center gap-4 text-center animate-bounce">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl font-bold shadow-lg shadow-emerald-100">
              ✓
            </span>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-neutral-800">Phone Verified</h3>
              <p className="text-xs text-neutral-400 font-medium">Redirecting you to Weekly Market storefront...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
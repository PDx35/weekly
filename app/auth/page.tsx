import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * Auth screen (Sprint 0 shell). Renders chrome-free via the root layout (it is
 * outside the `(shop)` route group). The real login/register tabs, social, and
 * phone-OTP flows are built in Sprint 2.
 */
export default function AuthPage() {
  return (
    <div className="auth">
      <div className="auth-art">
        <span className="logo">
          <span className="logo-mark">
            <Icon name="leaf" size={19} stroke={1.9} />
          </span>
          <span className="logo-text">
            fresh<b>mart</b>
          </span>
        </span>
        <div className="auth-art-mid">
          <h2>Fresh groceries, delivered in 30 minutes.</h2>
          <p>Sign in to track orders, save addresses, and check out faster.</p>
          <ul className="auth-points">
            <li>
              <Icon name="truck" size={18} /> 30-minute doorstep delivery
            </li>
            <li>
              <Icon name="shield" size={18} /> 100% quality promise
            </li>
            <li>
              <Icon name="tag" size={18} /> Member-only deals & coupons
            </li>
          </ul>
        </div>
        <span />
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1>Sign in</h1>
          <p className="auth-sub">
            Authentication arrives in Sprint 2. For now you can explore the storefront as a guest.
          </p>
          <Link className="btn btn-primary btn-lg btn-full" href={routes.home()}>
            Continue as guest
          </Link>
          <p className="auth-terms">
            By continuing you agree to FreshMart&apos;s Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

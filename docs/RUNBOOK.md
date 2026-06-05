# FreshMart — Release Runbook

Deploy target: **Vercel** (Next.js frontend) + **Firebase** (Auth, Firestore,
Storage) + **Razorpay** (payments). This runbook covers env config, security
rules, deploy, and the go-live checklist.

> ⚠️ The Firebase project `food-54848` is **shared** with an existing
> store/admin/delivery app. Do **not** blindly deploy [firestore.rules](../firestore.rules) /
> [storage.rules](../storage.rules) — they only cover the customer-web collections and deny
> everything else, which would break the other apps. Reconcile first (see
> "Security rules" below).

## 1. Environments & secrets

Set these in Vercel (Project → Settings → Environment Variables) and locally in
`.env.local` (see [.env.example](../.env.example)). Only `NEXT_PUBLIC_*` reach the browser.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | client | Production origin, e.g. `https://freshmart.app` (drives sitemap/robots/canonical) |
| `NEXT_PUBLIC_FIREBASE_*` | client | Web SDK config |
| `FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | server | Service account. Required for order placement; private key keeps `\n` escapes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | client | **Test key** in Preview; live key only in Production |
| `RAZORPAY_KEY_SECRET` | server | Matches the key id's mode |
| `RAZORPAY_WEBHOOK_SECRET` | server | Must equal the secret set on the Razorpay webhook |

Keep **test-mode Razorpay keys out of Production**. Use Vercel's per-environment
variables: test keys in Preview/Development, live keys in Production.

## 2. Security rules

1. Merge [firestore.rules](../firestore.rules) into the project's existing rules (keep the
   other apps' collections working) — don't replace wholesale.
2. Validate in isolation first: `npm run test:rules` (starts the Firestore
   emulator; needs `firebase-tools` + Java).
3. Deploy rules: `firebase deploy --only firestore:rules,storage:rules`.
4. Acceptance: a client cannot create/mutate an order or product, cannot read
   another user's data; catalogue is publicly readable. (Covered by
   [tests/rules/firestore.test.ts](../tests/rules/firestore.test.ts).)

## 3. Razorpay webhook

- URL: `https://<NEXT_PUBLIC_SITE_URL>/api/webhooks/razorpay`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`
- Active events: `payment.captured`, `order.paid` (optionally `payment.failed`)
- The handler is idempotent and is the backstop if the browser closes before
  client-side verification.

## 4. Deploy (Vercel)

1. Import the repo in Vercel; framework auto-detects Next.js.
2. Add all env vars (section 1) for Production (+ Preview with test keys).
3. Deploy. Catalogue pages are SSG with hourly ISR; route handlers run on demand.
4. Point the Razorpay webhook at the production URL (section 3).

## 5. Pre-launch checklist

- [ ] `npm run lint` clean, `npm run build` green
- [ ] `npm test` (unit: bill + coupon) green
- [ ] `npm run test:rules` green against the emulator
- [ ] Firestore/Storage rules reconciled + deployed
- [ ] All env vars set in Vercel (Production has **live** Razorpay keys)
- [ ] Razorpay webhook registered and reachable; secret matches
- [ ] Auth providers enabled (Email, Google, Phone) + production domain in
      Firebase Auth → Authorized domains
- [ ] Manual smoke test: browse → add to cart → sign in → address → COD order →
      confirmation; then a Razorpay **test-mode** online payment
- [ ] `sitemap.xml` and `robots.txt` resolve; product pages expose JSON-LD

## 6. Rollback

Vercel → Deployments → promote the previous successful deployment. Rules roll
back via `firebase deploy --only firestore:rules` from the prior revision.

## 7. Not yet wired (future)

- Playwright end-to-end happy-path test (needs Admin creds + test Razorpay keys)
- CI workflow to run unit + emulator rules tests on every PR
- Order status progression (packed → out_for_delivery → delivered) from the
  delivery/admin app, which the tracking screen already reads

# FreshMart Web

A Next.js (App Router, TypeScript strict) + Firebase customer storefront for
FreshMart, a 30-minute grocery delivery service. This repository is being built
sprint by sprint from the plan in [`docs/Plan.md`](docs/Plan.md); the design and
UX source of truth is the React prototype in
[`docs/design-template/`](docs/design-template/).

> **Status: Sprint 0 — Foundation.** The design system, app chrome, UI
> primitives, context shells, Firebase wiring, and placeholder routes are in
> place. Catalogue, auth, cart, checkout, payments, orders, and support land in
> later sprints.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19, TypeScript strict
- **Styling:** the prototype's CSS design system ported verbatim to
  [`app/globals.css`](app/globals.css), driven by CSS custom properties
  (`--brand`, `--font-head`, `--radius-card`, `--pad`, …)
- **Fonts:** Bricolage Grotesque + Hanken Grotesque (loaded in the root layout)
- **Backend:** Firebase Auth, Cloud Firestore, Cloud Storage
- **Tooling:** ESLint, Prettier

## Project structure

```
app/
  layout.tsx              # HTML shell, fonts, providers, global Toast
  globals.css             # ported design system (verbatim from the prototype)
  (shop)/                 # route group that renders the app chrome
    layout.tsx            # Header + MobileTop + main + Footer + MobileNav
    page.tsx              # home
    browse/ category/[slug]/ search/ product/[slug]/
    cart/ checkout/ confirm/[orderId]/
    orders/ account/ addresses/ support/
  auth/page.tsx           # chrome-free auth screen (outside the (shop) group)
components/
  ui/                     # Icon, Button, Img, Rating, Price, QtyStepper,
                          # ProductCard, SectionHead, Empty, Toast
  chrome/                 # Header, MobileTop, MobileNav, Footer, SearchBox, Logo
  Placeholder.tsx         # Sprint 0 route placeholder
lib/
  firebase/client.ts      # Web SDK (NEXT_PUBLIC_* env, client-safe)
  firebase/admin.ts       # Admin SDK (server only, never import in client code)
  data.ts                 # mock catalogue (replaced by Firestore in Sprint 1)
  types.ts                # shared domain types
  routes.ts               # nav-target → path helpers
store/
  cart.tsx                # CartProvider / useCart (in-memory for now)
  auth.tsx                # AuthProvider / useAuth (shell)
docs/                     # build plan + design-template prototype
```

### Class names are intentional

The components reuse the prototype's exact CSS class names (`.btn`, `.pcard`,
`.hdr`, …) so [`app/globals.css`](app/globals.css) keeps working unchanged. Do
not rename them.

### Client / server boundary

[`lib/firebase/admin.ts`](lib/firebase/admin.ts) holds privileged credentials
and imports `server-only`; it must **never** be imported from a client
component. Use [`lib/firebase/client.ts`](lib/firebase/client.ts) in the browser.

## Getting started

### Prerequisites

- Node.js 20+
- A Firebase project with Authentication, Firestore, and Storage enabled
- (Later sprints) a Razorpay account in test mode

### Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

### Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill it in.
`.env.local` is gitignored. Only `NEXT_PUBLIC_*` values reach the browser; the
Admin SDK and payment secrets are server-only.

| Variable | Scope | Where to find it |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | client | Firebase console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | client | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | client | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | client | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | client | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | client | same |
| `FIREBASE_ADMIN_PROJECT_ID` | server | service-account JSON |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server | service-account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server | service-account JSON (keep `\n` escapes; wrap in quotes) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | client | Razorpay dashboard (Sprint 4) |
| `RAZORPAY_KEY_SECRET` | server | Razorpay dashboard (Sprint 4) |
| `RAZORPAY_WEBHOOK_SECRET` | server | Razorpay dashboard (Sprint 4) |

> The app boots without Firebase credentials, but Auth/Firestore calls will fail
> until the `NEXT_PUBLIC_FIREBASE_*` values are set.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

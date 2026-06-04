# FreshMart Customer Website: Next.js + Firebase Build Plan

A full engineering plan to turn the existing FreshMart React prototype into a production grocery ordering website on Next.js and Firebase. This document covers scope, stack, architecture, the Firestore data model, payments, a sprint by sprint schedule, and copy ready prompts for an AI dev agent (Claude Code, Cursor, or similar) to execute each sprint.

---

## 1. Scope

**This phase (web):** A responsive customer website with the 13 required features below.

| Feature | What it covers |
| --- | --- |
| User Registration and Login | Email/password, Google, and phone OTP via Firebase Auth |
| Product Search | Search by product name and category |
| Category Browsing | Organized category pages and rails |
| Product Details Page | Images, price, MRP, rating, description, related items |
| Shopping Cart | Add, update quantity, remove, coupon, live bill |
| Address Management | Save, edit, delete, set default delivery address |
| Secure Checkout | Address plus slot plus payment selection, server validated |
| Online Payments | UPI, Cards, Wallets, Net Banking via Razorpay |
| Cash on Delivery | COD order placement |
| Order Tracking | Status stages after placement |
| Order History | Past orders plus downloadable invoices |
| Contact Support | Support ticket form plus FAQ |
| Responsive Design | Desktop, tablet, and mobile browsers |

**Later phases (out of scope now, but the backend is designed to support them):** Flutter customer mobile app, vendor app, delivery partner app, admin panel, super admin panel. The Firestore schema and security model below are shaped so these can be added without a rewrite.

**Existing asset:** The uploaded prototype is the design and UX source of truth. It already includes a complete design system (`styles.css`), shared UI primitives (`ui.jsx`), app chrome (`chrome.jsx`), all customer screens (home, browse, category, search, product, cart, checkout, confirm, orders, account, addresses, support), a mock catalogue (`data.js`), and a Context store (`store.jsx`). We port this, we do not redesign it.

---

## 2. Tech stack and rationale

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router, TypeScript) | SSR/SSG for SEO on catalogue pages, route handlers for server logic, image optimization |
| UI | Port of existing CSS design system | The prototype design is already polished and theme tokenized. Keep CSS variables, port to CSS Modules or a global stylesheet |
| Auth | Firebase Authentication | Email/password, Google, phone OTP out of the box |
| Database | Cloud Firestore | Real time, scales for orders and catalogue, simple security rules |
| File storage | Firebase Cloud Storage | Product and category images |
| Server logic | Next.js Route Handlers + Firebase Admin SDK | Price validation, order creation, payment verification. No separate function host needed for the web app |
| Background jobs | Cloud Functions (later) | Triggers for notifications and future vendor/admin flows |
| Payments | Razorpay | Native UPI, Cards, Net Banking, Wallets for India. Firebase has no built in payments, and Stripe does not cover UPI well in India. Razorpay also supports COD reconciliation |
| State | React Context (cart, auth) + lightweight client store | Mirrors the prototype store, easy port. Cart persists to localStorage for guests, syncs to Firestore on login |
| Hosting | Firebase App Hosting (all in Firebase) or Vercel (best Next.js DX) | See section 13 |
| Tooling | ESLint, Prettier, TypeScript strict, Vitest, Playwright | Quality gates and tests |

A note on why payments live server side: prices and totals must never be trusted from the browser. The server recomputes the bill from Firestore product prices before it creates a Razorpay order and before it writes the order document. This is the single most important security rule in the project.

---

## 3. Architecture overview

```
Browser (Next.js client components)
  |
  |  Firebase Web SDK (auth state, Firestore reads for catalogue/cart)
  v
Next.js server (App Router)
  |- Server Components: render catalogue, product pages (SSG/ISR)
  |- Route Handlers (/api/*): order creation, payment verify, webhooks, support tickets
  |       uses Firebase Admin SDK (privileged)
  v
Firebase
  |- Authentication (email, Google, phone OTP)
  |- Firestore (categories, products, users, orders, supportTickets, coupons)
  |- Cloud Storage (images)
  |- Cloud Functions (later: notifications, vendor/admin triggers)

Razorpay
  |- Order create (server) -> Checkout (client) -> Signature verify (server) -> Webhook (server)
```

Catalogue pages are statically generated and revalidated (ISR) so they are fast and SEO friendly. Cart, account, checkout, and orders are dynamic and auth gated.

---

## 4. Firestore data model

Collections and key fields, derived directly from `data.js` and `store.jsx`.

```
categories/{categoryId}
  name, slug, blurb, tint, ink, order:number

products/{productId}
  categoryId, name, slug, price:number, mrp:number|null, unit,
  rating:number, reviews:number, tag:string|null, desc:string|null,
  stock:boolean, images:string[], searchTokens:string[], createdAt

users/{uid}
  name, email, phone, createdAt
  users/{uid}/addresses/{addressId}
    label, name, phone, line1, line2, city, pin, type, isDefault:boolean
  users/{uid}/cart/{productId}        (optional server cart for logged in users)
    qty:number, addedAt

orders/{orderId}
  uid, items:[{ productId, name, unit, price, qty }],
  address:{...snapshot}, payment:{ method, label, status, razorpayPaymentId? },
  totals:{ items, delivery, handling, discount, grand },
  status:'confirmed'|'packed'|'out_for_delivery'|'delivered'|'cancelled',
  statusHistory:[{ status, at }], placedAt, eta

supportTickets/{ticketId}
  uid?, topic, orderId?, message, status:'open'|'resolved', createdAt

coupons/{code}
  type:'flat'|'percent', value, minSubtotal, active:boolean, expiresAt
```

Design notes:
- Order `items` store a price snapshot at purchase time so historical invoices stay correct even if catalogue prices change.
- `searchTokens` is a lowercase token array (name plus category name) so Firestore `array-contains` can power search without a separate search service. If search needs to scale, swap to Algolia or Typesense later.
- Address is snapshotted onto the order, not referenced, so deleting an address never corrupts order history.
- `coupons` doc id is the coupon code for O(1) lookup.

---

## 5. Security model (Firestore rules)

Principles:
- `categories` and `products`: public read, no client write. Admin writes only (later, via Admin SDK or admin panel).
- `users/{uid}` and subcollections: read and write only when `request.auth.uid == uid`.
- `orders`: a user can read only their own orders (`resource.data.uid == request.auth.uid`). No client create or update. Orders are created and updated only by the server (Admin SDK), which bypasses rules. This guarantees server validated totals and payment state.
- `supportTickets`: a signed in user can create their own ticket and read their own. Guests can create with no uid.
- `coupons`: public read of active coupons is acceptable, or keep validation server side only (preferred, so codes are not enumerable).

Acceptance test for rules: a malicious client cannot create an order, cannot write a product, cannot read another user's orders or addresses, and cannot mutate totals.

---

## 6. Payment flow (Razorpay)

Online payment (UPI, Card, Net Banking, Wallet):
1. Client posts the cart to `POST /api/checkout/create-order` with address id and chosen slot.
2. Server loads each product from Firestore, recomputes subtotal, applies coupon, and recomputes the full bill with the same logic as `computeBill` in the prototype (delivery fee rule, handling fee, discount).
3. Server creates a Razorpay order for the recomputed `grand` amount, writes a pending order doc, returns the Razorpay `order_id` and key id.
4. Client opens Razorpay Checkout with that order id. User pays.
5. On success Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
6. Client posts these to `POST /api/checkout/verify`.
7. Server verifies the HMAC SHA256 signature with the Razorpay secret. If valid, it marks the order `paid` and `confirmed`, clears the cart, and returns the order id.
8. A Razorpay webhook at `POST /api/webhooks/razorpay` confirms payment server to server as a backstop in case the browser closes before step 6.

Cash on Delivery:
1. Client posts to `POST /api/checkout/create-order` with `method: 'cod'`.
2. Server validates the bill, writes a `confirmed` order with `payment.status: 'pending_cod'`, clears the cart, returns the order id.

The browser never sets the amount. The server is the only writer of order totals and payment status.

---

## 7. Project structure

```
freshmart-web/
  app/
    layout.tsx                 # html shell, fonts, providers
    page.tsx                   # home
    browse/page.tsx
    category/[slug]/page.tsx
    search/page.tsx
    product/[slug]/page.tsx
    cart/page.tsx
    checkout/page.tsx
    confirm/[orderId]/page.tsx
    orders/page.tsx
    account/page.tsx
    addresses/page.tsx
    support/page.tsx
    auth/page.tsx
    api/
      checkout/create-order/route.ts
      checkout/verify/route.ts
      webhooks/razorpay/route.ts
      support/route.ts
  components/                  # ported ui.jsx + chrome.jsx primitives
    ui/ (Button, Icon, Price, Rating, QtyStepper, ProductCard, ...)
    chrome/ (Header, MobileTop, MobileNav, Footer, SearchBox)
  lib/
    firebase/client.ts         # web SDK init
    firebase/admin.ts          # admin SDK init (server only)
    razorpay.ts                # server helper
    bill.ts                    # computeBill, ported exactly from prototype
    queries.ts                 # Firestore read helpers
  store/
    cart.tsx                   # cart context, localStorage + Firestore sync
    auth.tsx                   # auth context
  styles/
    globals.css                # ported styles.css with theme tokens
  scripts/
    seed.ts                    # one time catalogue seed from data.js
  firestore.rules
  storage.rules
  .env.local
```

---

## 8. Environment and prerequisites

Create these before Sprint 0:
- Firebase project (Auth, Firestore, Storage enabled; Auth providers: Email, Google, Phone).
- Razorpay account in test mode (key id and secret).
- Service account JSON for the Admin SDK.

Environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

## 9. Sprint plan overview

Seven sprints, roughly one to two weeks each for a small team. Each sprint ends with something demoable and deployable.

| Sprint | Theme | Outcome |
| --- | --- | --- |
| 0 | Foundation and setup | Next.js + TS + Firebase wired, design system ported, base layout and routing live |
| 1 | Catalogue and browse | Seeded Firestore, home, browse, category, product, search, responsive chrome |
| 2 | Auth and account | Login/register (email, Google, OTP), account dashboard, address management |
| 3 | Cart and checkout shell | Cart with coupon and bill, checkout UI, server order validation, COD end to end |
| 4 | Online payments | Razorpay create, verify, webhook, confirmation screen |
| 5 | Orders, tracking, support | Order history, tracking stages, PDF invoices, support tickets and FAQ |
| 6 | Hardening and launch | Security rules audit, SEO, performance, analytics, tests, deploy |

---

## 10. Detailed sprints with AI dev agent prompts

Each sprint lists the goal, tasks, deliverables, an agent prompt you can paste into your dev agent, and acceptance criteria. The prompts assume the agent has the uploaded prototype files available as reference in the repo under `/reference`.

### Sprint 0: Foundation and setup

**Goal:** A running Next.js app connected to Firebase with the prototype design system ported and the base layout and routing in place.

**Tasks:** scaffold Next.js with TypeScript, install and init Firebase web and admin SDKs, port `styles.css` to `app/globals.css` and load the same fonts, port the `Icon`, `Button`, `Price`, `Rating`, `QtyStepper`, `Img`, `SectionHead`, `Empty`, `Toast` primitives from `ui.jsx`, build the root layout with header, mobile top bar, bottom nav, and footer from `chrome.jsx`, set up cart and auth context shells.

**AI dev agent prompt:**
```
You are setting up a Next.js 16 (App Router, TypeScript, strict) project named
freshmart-web. A reference React prototype is in /reference (files: ui.jsx,
chrome.jsx, styles.css, app.jsx, data.js, store.jsx, plus screens-*.jsx).

Do this:
1. Scaffold Next.js with App Router and TypeScript strict, ESLint and Prettier.
2. Add Firebase: create lib/firebase/client.ts (web SDK, reads NEXT_PUBLIC_*
   env vars) and lib/firebase/admin.ts (Admin SDK, server only, reads
   FIREBASE_ADMIN_* env vars). Never import admin.ts in a client component.
3. Port /reference/styles.css to app/globals.css verbatim, keeping all CSS
   custom properties (--brand, --font-head, --radius-card, --pad, etc.). Load
   the same fonts (Bricolage Grotesque, Hanken Grotesque) via next/font or a
   font link in the root layout.
4. Port these UI primitives from /reference/ui.jsx to TypeScript React
   components in components/ui/, preserving class names exactly so the CSS
   keeps working: Icon (with the full ICONS path map), Button, Img, Rating,
   Price (with the rupee helper), QtyStepper, ProductCard, SectionHead, Empty,
   Toast.
5. Port the app chrome from /reference/chrome.jsx to components/chrome/:
   Header, MobileTop, MobileNav, Footer, SearchBox, Logo. Replace the
   prototype state router with Next.js navigation (next/link, useRouter). Map
   the old nav targets to real routes (home '/', browse '/browse', category
   '/category/[slug]', product '/product/[slug]', cart '/cart', orders
   '/orders', account '/account', addresses '/addresses', support '/support',
   auth '/auth').
6. Build app/layout.tsx as the shell: Header + MobileTop + main + Footer +
   MobileNav + Toast, wrapped in CartProvider and AuthProvider (create context
   shells in store/cart.tsx and store/auth.tsx for now; cart can be in-memory).
7. Create placeholder route pages for every route above so navigation works.

Constraints: TypeScript strict, no any. Keep all CSS class names identical to
the prototype. Do not redesign anything. Commit with a clean folder structure
matching the plan. Provide a README with setup and env var instructions.
```

**Acceptance criteria:** app builds and runs, every route renders a placeholder, header and footer match the prototype visually, theme tokens apply, no console errors, Firebase client initializes without leaking admin credentials to the browser.

---

### Sprint 1: Catalogue and browse

**Goal:** Real catalogue data in Firestore and all browsing surfaces working: home, browse, category, product detail, and search.

**Tasks:** write a seed script that loads categories and products from `data.js` into Firestore (with `slug` and `searchTokens`), build read helpers, implement home (hero, category pills, best sellers and deals rails, promo strip, banner), browse, category pages with sort and filter, product detail with gallery, highlights, accordions, and related items, and search by name and category.

**AI dev agent prompt:**
```
Implement the FreshMart catalogue and browsing on top of the Sprint 0 base.
Reference screens: /reference/screens-home.jsx, screens-browse.jsx, data.js,
ui.jsx (ProductCard, SortBar logic in useSortFilter).

1. scripts/seed.ts: read the CATEGORIES and PRODUCTS arrays from
   /reference/data.js and write them to Firestore. For each category add a
   slug. For each product add a slug and a searchTokens array (lowercase tokens
   from the product name and its category name). Add order fields so categories
   keep their original sequence. Make the script idempotent (upsert by id).
2. lib/queries.ts: getCategories(), getCategoryBySlug(slug),
   getProductsByCategory(categoryId), getProductBySlug(slug),
   searchProducts(query) using array-contains on searchTokens, getBestsellers()
   and getDeals() matching the prototype's curated lists.
3. Home page (app/page.tsx): port HeroBasket (default hero), PromoStrip, the
   category grid (CategoryPills), Best sellers rail, the weekend savings banner,
   and Today's deals rail. Use Server Components with ISR (revalidate hourly).
4. Browse page: a section per category with a horizontal rail and a See all
   link, ported from BrowseScreen.
5. Category page (app/category/[slug]/page.tsx): tinted hero, the SortBar
   (Popularity, Price low/high, Top rated, On offer filter) ported from
   useSortFilter and SortBar, and a responsive product grid.
6. Product page (app/product/[slug]/page.tsx): gallery with thumbnail switcher,
   unit, name, rating, price with MRP and percent off, description, quantity
   stepper plus Add to cart, the four highlight tiles, and the Product details
   and Delivery and returns accordions, plus a You might also like rail. Use
   generateStaticParams for all product slugs with ISR.
7. Search page (app/search/page.tsx): read q from the query string, show
   results grid, suggested category chips, and an Empty state when nothing
   matches. Wire the header SearchBox live suggestions to real Firestore data.

Constraints: catalogue pages must be statically generated with ISR for SEO and
speed. Reuse the ported ProductCard and SortBar. Keep class names identical.
Add generateMetadata to product and category pages (title, description, open
graph). TypeScript strict.
```

**Acceptance criteria:** categories and products visible from Firestore, all four browse surfaces work, sort and filter behave, product pages are statically generated and have correct metadata, search returns name and category matches with a working empty state, fully responsive at mobile, tablet, desktop.

---

### Sprint 2: Auth and account

**Goal:** Real authentication and the account area, including address management persisted to Firestore.

**Tasks:** implement Firebase Auth (email/password, Google, phone OTP with reCAPTCHA), port the auth screen with login and register tabs and the social and guest options, build the auth context with persisted state, gate protected routes, build the account dashboard, and full address CRUD with default selection.

**AI dev agent prompt:**
```
Implement authentication and the account area. Reference:
/reference/screens-account.jsx (AuthScreen, AccountScreen, AddressesScreen),
screens-cart.jsx (AddressForm, AddressCard, Field), store.jsx (user, addresses,
upsertAddress, deleteAddress, selectedAddr).

1. store/auth.tsx: an AuthProvider using Firebase Auth onAuthStateChanged.
   Expose user, loading, signInEmail, registerEmail, signInGoogle,
   signInWithPhone (OTP with invisible reCAPTCHA), signOut. On first sign in,
   create the users/{uid} doc if missing.
2. app/auth/page.tsx: port AuthScreen with the login and register tabs, the
   left marketing panel, password show/hide, the social buttons (Google works,
   Apple and Phone OTP wired to the OTP flow), and the Skip as guest option.
   Redirect to home after success.
3. Route protection: account, addresses, orders, and checkout require auth.
   Unauthenticated users are redirected to /auth with a return path.
4. app/account/page.tsx: port AccountScreen. Avatar initials, profile fields
   from the users doc, the four tiles (orders, addresses, cart, support) with
   live counts, and Log out.
5. Addresses: app/addresses/page.tsx with the list, AddressCard,
   add and edit forms (AddressForm + Field), set default, and remove. Persist
   to users/{uid}/addresses. Keep selectedAddr in the auth or a small profile
   context. Show a toast on each change, matching the prototype.

Constraints: phone OTP must use Firebase reСАPTCHA correctly. Never write user
docs from an unauthenticated context. Validate address fields (pin is 6 digits,
phone format). Match the prototype layout and class names. TypeScript strict.
```

**Acceptance criteria:** a user can register and log in by email, Google, and phone OTP, the account dashboard shows real data, addresses persist across reloads and devices, default address logic works, protected routes redirect guests, and a logged out user cannot read another user's addresses (verified against rules).

---

### Sprint 3: Cart and checkout shell

**Goal:** A working cart with coupon and live bill, a complete checkout UI, server side bill validation, and COD orders placed end to end. Online payment is stubbed until Sprint 4.

**Tasks:** build the cart context with localStorage persistence for guests and Firestore sync on login, port the cart screen with quantity controls, coupon, and bill, port `computeBill` exactly into `lib/bill.ts`, build the checkout screen (address picker, delivery slot, payment method selector with the UPI/Card/Net Banking/Wallet/COD forms), and implement the server order endpoint that recomputes totals and writes the order for COD.

**AI dev agent prompt:**
```
Implement cart, the checkout UI, and server validated COD order placement.
Reference: /reference/screens-cart.jsx (CartScreen, CheckoutScreen, BillRows,
PaymentForms, computeBill, the coupon logic), store.jsx (cart, addToCart,
setQty, removeFromCart, cartSubtotal, placeOrder, seedOrders).

1. lib/bill.ts: port computeBill exactly (subtotal, the delivery fee rule, the
   handling fee, discount, grand). This logic must be identical on client (for
   display) and server (for the authoritative total).
2. store/cart.tsx: cart state keyed by productId to qty. Persist to
   localStorage for guests. On sign in, merge the local cart into
   users/{uid}/cart and keep them in sync. Expose addToCart, setQty,
   removeFromCart, clearCart, cartItems (hydrated with product data),
   cartCount, cartSubtotal.
3. app/cart/page.tsx: port CartScreen. Item rows with QtyStepper and remove,
   the coupon input with validation against the coupons collection (or a
   server endpoint), the bill summary via BillRows with the free delivery note,
   the safe payments note, and an Empty state. A sticky proceed to checkout
   button.
4. app/checkout/page.tsx: port CheckoutScreen. Address selection (existing
   addresses plus add new inline), a delivery slot picker, the payment method
   selector with PaymentForms for UPI, Card, Net Banking, Wallet, and COD, and
   the order summary with BillRows. The place order button label changes for
   COD vs pay.
5. app/api/checkout/create-order/route.ts: a server route using the Admin SDK.
   Input: the address id, chosen slot, coupon code, payment method. The server
   loads every product in the user cart from Firestore, recomputes subtotal and
   bill with lib/bill.ts, validates the coupon server side, and for method 'cod'
   writes a confirmed order with payment.status 'pending_cod', snapshots the
   address and item prices, clears the server cart, and returns the order id.
   For online methods, return the computed amount and a flag (Razorpay wired in
   Sprint 4). Reject if any product is out of stock or the client sent a total
   that does not match the server total.

Constraints: the server is the only writer of orders and totals. The client
total is for display only and is never trusted. Use the order id format from
store.jsx placeOrder. After a COD order, navigate to /confirm/[orderId].
TypeScript strict.
```

**Acceptance criteria:** cart persists for guests and syncs on login, coupon applies and rejects invalid codes, the bill matches the prototype math, checkout collects address, slot, and method, a COD order is created server side with validated totals and a snapshot, the cart clears after placement, and a tampered client total is rejected by the server.

---

### Sprint 4: Online payments (Razorpay)

**Goal:** Working UPI, Card, Net Banking, and Wallet payments with server side verification and a webhook backstop, plus the order confirmation screen.

**Tasks:** add the Razorpay server helper, implement create order, verify, and webhook endpoints, integrate Razorpay Checkout on the client, mark orders paid only after server verification, and port the confirmation and initial tracking screen.

**AI dev agent prompt:**
```
Add Razorpay online payments to the Sprint 3 checkout. Reference:
/reference/screens-cart.jsx (ConfirmScreen, TRACK_STAGES, BillRows).

1. lib/razorpay.ts (server): a helper to create Razorpay orders and to verify
   the payment signature (HMAC SHA256 of order_id|payment_id with
   RAZORPAY_KEY_SECRET).
2. Extend app/api/checkout/create-order/route.ts: for online methods, after
   recomputing the authoritative bill, create a Razorpay order for that amount,
   write a pending order doc, and return { razorpayOrderId, amount, keyId,
   freshmartOrderId }.
3. Client checkout: when the method is online, open Razorpay Checkout with the
   returned order id and key. On success, post razorpay_payment_id,
   razorpay_order_id, razorpay_signature, and the freshmartOrderId to
   /api/checkout/verify.
4. app/api/checkout/verify/route.ts: verify the signature server side. If valid,
   set the order to confirmed with payment.status 'paid' and store the payment
   id, clear the cart, and return the order id. If invalid, leave the order
   pending and return an error.
5. app/api/webhooks/razorpay/route.ts: verify the webhook signature with
   RAZORPAY_WEBHOOK_SECRET and mark the matching order paid if not already, as a
   backstop when the browser closes before client verification. Make it
   idempotent.
6. app/confirm/[orderId]/page.tsx: port ConfirmScreen. Success check, order id,
   ETA, the TRACK_STAGES progress, the delivery address, the bill via BillRows,
   the paid via line, and actions to track or continue shopping.

Constraints: an order is only paid after server signature verification or a
verified webhook. Never trust the client to declare success. Test mode keys
only in non production. Handle payment failure and dismissal gracefully (order
stays pending, user can retry). TypeScript strict.
```

**Acceptance criteria:** a test UPI or card payment completes, the order flips to paid only after server verification, the webhook independently confirms payment, a dismissed payment leaves a retryable pending order, and the confirmation screen renders correctly for both paid and COD orders.

---

### Sprint 5: Orders, tracking, and support

**Goal:** Order history with invoices, order status tracking, and the support center.

**Tasks:** build order history from Firestore, the tracking view using the status stages, downloadable PDF invoices, reorder, and the support page with FAQ and a ticket form that writes to Firestore.

**AI dev agent prompt:**
```
Implement orders, tracking, invoices, and support. Reference:
/reference/screens-account.jsx (OrdersScreen, InvoiceModal, timeAgo,
SupportScreen), screens-cart.jsx (ConfirmScreen tracking, TRACK_STAGES).

1. app/orders/page.tsx: port OrdersScreen. List the signed in user's orders
   from Firestore (newest first), each card showing status badge, id, time ago,
   item thumbnails, total, item count, and payment label, with Invoice, Track
   (if not delivered), and Reorder (if delivered) actions. Empty state when no
   orders.
2. Invoice: port InvoiceModal. Render a tax invoice with billed to, payment,
   an itemized table, the bill rows, and FSSAI footer. Add real PDF download
   via a client PDF library or a server route that streams a generated PDF.
3. Tracking: reuse the confirm screen tracking stages for orders that are not
   delivered, driven by the order status and statusHistory.
4. Reorder: add the delivered order's items back into the cart and navigate to
   the cart, matching the prototype behavior.
5. app/support/page.tsx: port SupportScreen. The hero with call, email, and
   chat channels, the FAQ accordion, and the submit a request form (topic,
   optional order id, message). Write tickets to the supportTickets collection
   and show the success state with a generated ticket id.

Constraints: a user sees only their own orders and tickets (enforced by rules
and queries). Invoices must use the order's price snapshot, not live prices.
Match the prototype layout and class names. TypeScript strict.
```

**Acceptance criteria:** order history loads the user's real orders, invoices render and download as PDF using snapshot prices, tracking reflects the order status, reorder repopulates the cart, support tickets persist and show a confirmation, and a user cannot read another user's orders or tickets.

---

### Sprint 6: Hardening and launch

**Goal:** A secure, fast, SEO ready, tested, and deployed website.

**Tasks:** finalize and test Firestore and Storage security rules, add SEO (metadata, sitemap, robots, structured data for products), optimize performance (next/image, ISR, code splitting), add analytics and error monitoring, write unit tests for bill and coupon logic and end to end tests for the core purchase flow, and deploy.

**AI dev agent prompt:**
```
Harden, test, and prepare FreshMart for launch.

1. Security: finalize firestore.rules and storage.rules per the plan. Add a
   rules test suite (Firebase emulator) proving: public can read products and
   categories but not write; a user reads and writes only their own user doc,
   addresses, orders (read only), and tickets; no client can create or mutate
   an order or product. Run against the emulator in CI.
2. SEO: per page generateMetadata, a dynamic sitemap.ts covering all category
   and product slugs, robots.ts, canonical URLs, and Product structured data
   (JSON-LD) on product pages.
3. Performance: use next/image for all real images, confirm catalogue pages are
   SSG with ISR, lazy load non critical client components, and check Core Web
   Vitals. Target Lighthouse 90+ on mobile for home and product pages.
4. Observability: add an analytics provider and a client and server error
   monitor (for example Sentry). Track add to cart, begin checkout, and
   purchase events.
5. Tests: Vitest unit tests for lib/bill.ts (every fee and discount branch) and
   coupon validation. Playwright end to end test for the full happy path:
   browse, add to cart, log in, choose address, place a COD order, see the
   confirmation, then a Razorpay test mode online payment path.
6. Deploy: configure the chosen host (Firebase App Hosting or Vercel), set
   production env vars and Razorpay live keys behind a feature flag, configure
   the Razorpay webhook URL, and document a release runbook.

Constraints: do not ship until the rules test suite passes and the e2e happy
path is green. Keep test mode keys out of production. TypeScript strict.
```

**Acceptance criteria:** rules tests pass in CI, Lighthouse is 90+ on key pages, the e2e purchase flow passes for COD and online test payments, sitemap and structured data validate, analytics and error monitoring report events, and the site is deployed with the webhook reachable.

---

## 11. Cross cutting standards

- Accessibility: keyboard navigable, labelled controls, sufficient contrast, focus states. The prototype already uses semantic buttons and aria labels; preserve them.
- Responsive: keep the prototype breakpoints. The bottom mobile nav and mobile top bar already exist in `chrome.jsx`.
- Error and empty states: reuse the prototype `Empty` and `Toast` components everywhere.
- Type safety: define shared types (Product, Category, Order, Address, CartItem) in one place and use them across client and server.
- No secrets in the client: only `NEXT_PUBLIC_*` values reach the browser. Admin SDK, Razorpay secret, and webhook secret are server only.

---

## 12. Testing strategy

- Unit (Vitest): bill computation, coupon rules, search token generation, address validation.
- Integration: API route handlers with the Firebase emulator (order creation rejects tampered totals and out of stock items, verify endpoint rejects bad signatures).
- Rules tests: the emulator suite from Sprint 6.
- End to end (Playwright): the full purchase flow for COD and an online test payment, plus auth and address management.

---

## 13. Deployment

Two viable paths:

- **Vercel for the frontend, Firebase for the backend (recommended for fastest Next.js delivery):** best in class Next.js support, easy ISR and preview deployments. Firebase remains the data, auth, and storage layer. Razorpay webhook points at a Vercel route.
- **Firebase App Hosting (recommended if you want everything in one vendor):** Firebase App Hosting supports Next.js SSR and keeps hosting, auth, Firestore, and storage under one project and one bill. Confirm current Next.js version support before committing.

For either path: keep test mode Razorpay keys in preview and staging, switch to live keys only in production behind a flag, and register the production webhook URL in the Razorpay dashboard.

---

## 14. Future extension (designed for, not built now)

The schema and server boundaries above already support the rest of the platform in the spec:
- Flutter mobile app: reuses the same Firebase Auth, Firestore, and the same `/api/checkout/*` endpoints. Add push notifications via Firebase Cloud Messaging.
- Vendor app and admin/super admin panels: add role claims to Firebase Auth, vendor and admin collections, and Cloud Functions triggers (order assignment, inventory, commissions). Product and order writes already flow through privileged server code, so adding admin writes is incremental.
- Delivery partner app: add a `deliveries` collection and status transitions that update `orders.status` and `statusHistory`, which the customer tracking screen already reads.
- Coupons, loyalty, referrals, banners, and pincode serviceability: each is a new collection plus rules plus a server endpoint, layered on without touching the customer purchase flow.

---

## 15. Appendix: useful commands

```
npx create-next-app@latest freshmart-web --typescript --app --eslint
npm i firebase firebase-admin razorpay
npm i -D vitest @playwright/test @firebase/rules-unit-testing prettier
npx tsx scripts/seed.ts            # seed catalogue
firebase emulators:start           # local auth + firestore + rules tests
npm run dev                        # next dev
```

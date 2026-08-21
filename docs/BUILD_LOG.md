# Build log

Evidence is added only after a real command or browser check completes. Credentials and provider payloads must never be recorded here.

## 2026-08-16 — implementation started

- Confirmed the workspace contained only a disposable starter and no business, customer, order, lead, revenue, or integration data.
- Confirmed the required repository status documents were absent and created the initial plan/status records.
- Replaced the temporary starter runtime definition with the requested production Next.js foundation. Verification remains pending.

## 2026-08-16 — implementation completed

### Delivered

- Built the responsive homepage, desktop/mobile navigation, search drawer, category journey, popular products, genuine bundle calculation, trust, sizing, and final conversion sections.
- Built catalogue validation, exact variant inventory, product metadata, product galleries, explicit option selection, out-of-stock disabling, low-stock evidence, bundle combinations, related-product cross-sells, and neutral certification handling.
- Built a device-local non-sensitive cart, add confirmation drawer, restored-cart display, stock-bounded quantities, helmet-to-goggles upsell, empty cart, cart page, and checkout fallback.
- Built deterministic checkout policy checks for origin, `businessId`, item count, products, variants, stock, Stripe Price IDs, and idempotency; browser-supplied prices are ignored.
- Built Stripe Checkout session creation and signature-verified webhook handling. No provider check was attempted because credentials are absent; status remains `NOT_CONFIGURED` and no inventory mutation is claimed.
- Built shipping, size guide, returns, helmet information, FAQ, contact, privacy, terms, verified order status, 404, runtime error, robots, sitemap, manifest, structured data, and social metadata.
- Added an original RIDELINE social preview asset at `public/og.png`; it is a brand graphic, not product photography.
- Added the owner README, launch checklist, quick-edit guide, product-photo guide, architecture, security, and data-model documentation.

### Automated evidence

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test` — PASS, 2 files and 13 tests.
- `npm run build` — PASS with Next.js 16.3.1; 24 static/dynamic route entries generated.
- `npm run audit:fake-data` — PASS; no forbidden fake claims, rating data, test-fixture names in production source, console logging, or key-like patterns.
- `npm audit` and `npm audit --omit=dev` — PASS after non-breaking dependency updates; 0 known vulnerabilities reported.
- Production HTTP sweep — PASS for home, shop, five product pages, cart, size guide, shipping, returns, safety, FAQ, contact, privacy, terms, order status, robots, and sitemap; an unknown page returned the expected 404. Security response headers were present on checked 200 routes.
- API boundary checks — missing-origin checkout returned 400, empty-cart checkout returned 400, and an unconfigured webhook returned 503.

### Browser evidence

- Checked responsive home layout at 320, 375, 390, 430, 768, 1024, and 1440 CSS pixels in the local Chromium-based in-app browser. Fixed narrow-layout overflow.
- Inspected mobile and desktop hero, product imagery placeholders, navigation, and mobile sticky purchase UI.
- Verified the accessible mobile drawer opens, is keyboard-contained, and restores the background boundary.
- Verified a Marketplace-style UTM product URL renders the same product without exposing query parameters in the interface.
- Verified XXL disabled at zero stock, size L shows `ONLY 1 LEFT`, and quantity cannot exceed the exact variant stock.
- Verified explicit size choice is required before add-to-cart; mobile sticky UI prompts `CHOOSE SIZE` instead of silently selecting a variant.
- Verified cart add confirmation, matching-goggles upsell, checkout-not-configured message, local cart restoration after reload, and restored-cart item display.
- Verified mobile product search/filter behavior, including a zero-result exact category/size combination.
- Verified white-bundle size L is unavailable while XXL remains selectable.
- Verified invalid product URL uses the branded 404 and direct order-success navigation displays `ORDER NOT VERIFIED`.
- Verified the unconfigured contact form returns a visible honest message and does not silently discard the enquiry.

### Honest limitations / owner gates

- Stripe, webhook, analytics, contact delivery, and final domain are not configured. No real provider response has been labelled verified.
- Product photos are labelled placeholders. Product names, prices, exact physical stock, specifications, and certification evidence require owner confirmation.
- Manufacturer centimetre sizing charts are intentionally absent pending verification.
- Shipping price/timing, tracking, returns, sizing exchanges, legal identity, ABN, email, phone, and social links require owner confirmation.
- Inventory is repository-managed and not transactionally decremented. Reconcile it manually after paid orders or migrate to database-backed inventory before sales volume increases.
- Browser interaction QA was available in Chromium only. Safari, Firefox, Edge, and real-device checkout remain required launch checks and are not marked verified.
- Vercel build compatibility is verified locally; an actual Vercel deployment and custom domain are not verified.

## 2026-08-17 — APEX MOTO reconstruction

### Owner data and assets

- Replaced the temporary RIDELINE identity with APEX MOTO across configuration, metadata, navigation, contact details, manifest, favicon, social presentation, documentation, and customer-facing copy.
- Inspected and used the supplied APEX MOTO logo, black and white ORZ helmet photos, three ORZ goggle photos, helmet specification sheet, and helmet-bag photo.
- Transcribed the owner-supplied prices: helmets $124.95, goggles $25 alone, and goggles $20 in the $144.95 helmet bundle with the helmet bag included free.
- Transcribed black helmet stock as one each in S, M, L, and XL. Set black XXL unavailable. Set the explicitly named white sold-out sizes S, L, and XL to zero; conservatively left white XXL unavailable and inferred one white Medium. Set a conservative minimum of one for each photographed goggle colour. The two inferred quantities are called out in the launch checklist and status file.
- Transcribed the supplied ORZ size chart, ABS material, approximate 1080 g weight, and visible rear DOT FMVSS No. 218 marking. Customer copy states that the marking is visible but does not by itself establish Australian road legality; no separate approval number or document is claimed.

### Design and commerce changes

- Reconstructed the visual system as a near-black, off-white, and metallic-gold APEX MOTO storefront with shorter copy, a product-first mobile hero, real product photography, a compact catalogue, and a custom bundle composition using the supplied helmet, goggles, and bag assets.
- Consolidated goggles into one product with Black / Gold, Red / Gold, and Grey / Ice variants. Colour selection now switches the gallery to the matching supplied image.
- Rebuilt the actual bundle combinations across helmet colour, helmet size, and all three goggle colours. The $5 saving is derived from catalogue component prices.
- Added server-owned shipping rules for $8 goggles-only delivery; exact owner-supplied helmet destination prices; no extra cost for up to three standalone goggles with a helmet; and quote-required gates for regional Queensland, regional Western Australia, and larger goggle quantities.
- Simplified the cart drawer and added a compact cart delivery selector with derived shipping and total. Stripe receives only the selected server-approved exact method and price.
- Generated and visually checked one bespoke APEX MOTO social card from the supplied logo, helmet, and goggles. The exact rendered text is “APEX MOTO” and “READY FOR THE DIRT.”

### Automated evidence

- `npm run verify` — PASS: lint, strict TypeScript, 15 tests, Next.js 16.3.1 production build with 23 route entries, and production-content audit.
- `npm audit` and `npm audit --omit=dev` — PASS; 0 known vulnerabilities.
- Route sweep — PASS: 18 expected 200 responses plus the expected 404, all with the configured content security policy.
- API boundary checks — missing origin 400, empty cart 400, regional quote 400, Stripe not configured 503, webhook not configured 503.

### Browser evidence

- Verified homepage width at 320, 375, 390, 430, 768, 1024, and 1440 CSS pixels with no document-width overflow.
- Found and fixed an oversized mobile hero and a mobile cart intrinsic-width overflow during the review.
- Verified the 320-pixel first screen shows the real helmet, product identity, price, concise heading, and both primary actions.
- Verified mobile navigation opens with Shop, Helmets, Goggles, Bundle, Size Guide, Shipping, and Contact, then closes correctly.
- Verified matte-black size L selects with `Only 1 left`, adds to cart, persists the exact variant, and opens the add confirmation.
- Verified Red / Gold goggle selection updates the main image to the supplied red-and-gold photo.
- Verified a Gloss White bundle enables only Medium and disables S, L, XL, and XXL.
- Verified the cart applies Melbourne helmet shipping at $25.20 and calculates a $150.15 total from a $124.95 helmet.

### Remaining launch gates

- Stripe, webhook delivery, hosted deployment, custom domain, and form-provider delivery remain `NOT_CONFIGURED`.
- Exact goggle quantities and the inferred white Medium quantity require owner confirmation before real orders.
- Dispatch timing, tracking practice, returns/exchange terms, legal identity where applicable, and separate helmet certification documentation remain owner decisions.
- Chromium browser QA is recorded. Current Safari, Firefox, Edge, real-device, and live Stripe checkout checks remain required.

## 2026-08-17 — higher-resolution product and checkout update

### Delivered

- Replaced the matte-black helmet, gloss-white helmet, Black / Gold goggles, Red / Gold goggles, and Grey / Ice goggles with the owner-supplied higher-resolution photos. Three additional photographed colourways remain unpublished because their sale availability and stock were not confirmed.
- Moved the supplied APEX MOTO image logo from the homepage hero into the sticky site header and reduced the desktop hero heading so “Ready for the dirt.” stays clear of the product visual.
- Changed incomplete product selection from a disabled dead end into active validation: Add to cart now identifies the first missing option, scrolls it into view, shakes the group, turns it red, and announces the exact required choice. No item is added until the selection resolves to an in-stock variant.
- Simplified the cart drawer and payment action labels to “Checkout”.
- Kept product and shipping amounts server-owned. Stripe Checkout line-item price data is derived from the validated catalogue after origin, business, item, variant, stock, quantity, and shipping checks; browser-supplied prices remain ignored.
- Added the verified production fallback origin `https://apexmoto.vercel.app` while retaining an environment override for a future custom domain.

### Stripe evidence and credential boundary

- Confirmed the connected Stripe plugin is authenticated to the `APEX WEB sandbox` account.
- Created four real test-mode Stripe products and matching one-time AUD prices for the two helmets, goggles, and bundle. These are provider-side sandbox evidence only; no live-mode capability is claimed.
- Did not use or store the secret pasted into chat. Because that credential was exposed in conversation, it must be rotated before any replacement is added through protected local or Vercel environment settings.
- Webhook delivery and a deployed successful Checkout Session remain unverified until a fresh server credential and webhook signing secret are configured.

### Verification evidence

- Workspace-wide key-pattern scan — PASS; no Stripe key-like value is present in source files.
- `npm run verify` — PASS: lint, strict TypeScript, 15 tests, Next.js 16.3.1 production build with 23 route entries, and production-content audit.
- `npm audit --omit=dev` — PASS; 0 known production dependency vulnerabilities.
- Browser check at 1280 × 720 — PASS: header logo is constrained to 64 × 64, the hero heading ends before the product visual, the new goggle image is loaded, and the cart uses the “Checkout” label without horizontal overflow.
- Missing-size interaction — PASS: after hydration, clicking Add to cart with no size leaves the cart count unchanged and displays `Please choose size.` in an `aria-invalid` animated option group.

### GitHub and Vercel production evidence

- Connected the existing local source to the owner-created public GitHub repository `maxlhill204-lab/APEXMOTO`; added the previously omitted `.gitignore` and `.env.example` so generated files and credentials stay out of later uploads.
- Published the update through GitHub pull request #1. Vercel preview checks passed, the pull request was merged to `main`, and production commit `4c6ca166` received a successful Vercel deployment status.
- Verified the public production alias `https://apexmoto.vercel.app` returns HTTP 200, includes the updated header markup, and emits `https://apexmoto.vercel.app` as its canonical origin instead of localhost.
- Sent one bounded production checkout-start request using an in-stock black Large helmet and pickup. The server returned the expected controlled HTTP 503 with no Checkout URL because `STRIPE_SECRET_KEY` is not configured in Vercel. No payment or paid order was created.
- The exposed credential was not used locally, in GitHub, or in Vercel. Production checkout remains `AUTH_REQUIRED` until the owner rotates that credential and stores a fresh replacement through Vercel’s protected environment settings.

## 2026-08-21 — checkout reliability reconstruction in progress

- Reproduced the production risk boundary: an unsigned probe to the live webhook returned `NOT_CONFIGURED`, and the deployed handler contained no order, inventory or email mutation. Runtime logs contained no recoverable order evidence.
- Implemented the reviewed Postgres migration for durable orders/items, shared physical SKU stock and reservations, append-only order/inventory/webhook evidence, bounded email outbox, cancellations, public pickup settings and rate-limited owner access.
- Rebuilt checkout to fail closed unless database, signed webhook, order access and transactional email configuration are all present. It now creates/reserves the order before Stripe and verifies exact amount/currency exactly once after payment.
- Implemented detailed success/status/help journeys, purchased-cart reconciliation, automatic customer/owner emails, cancellation acknowledgement, refund confirmation, owner order desk, inventory adjustment, pickup settings and email retry.
- Added current operating, email and provider-setup documentation. No database, Resend sender, Stripe endpoint, customer order, refund, provider write or production deployment has been created or represented as verified during this revision.
- Intermediate strict TypeScript passed and the expanded unit suite passed 20 of 20. Final lint/build/audit/browser/deployment evidence remains pending and will be appended only after completion.

### Local completion evidence

- `npm run verify` — PASS after the final application changes: ESLint, strict TypeScript, 20 tests, Next.js 16.3.1 production build with 24 routes, and production-content/key audit.
- `npm audit` and `npm audit --omit=dev` — PASS; zero known vulnerabilities.
- React quality review — PASS after stabilising purchased-cart reconciliation callbacks, authenticating every owner Server Action, fixing redirect/error control flow, adding required admin state selection, and parallelising independent owner reads.
- Local browser — PASS: revised cart displayed the exact item/variant/quantity/total, Newport pickup disclosure, 26 August date, appointment/private-address wording, confirmation name/email, mandatory acknowledgement and one Checkout button. Clicking without acknowledgement produced a specific accessible error; completing the review produced the expected fail-closed configuration message without creating payment.
- Local browser — PASS: `/admin/login` rendered as a separate private order-desk experience and truthfully reported that provider/owner access setup remains incomplete. The development server recorded the expected 200 page/API responses and controlled 503 checkout gate with no runtime exception.
- Production provider flow, migrated database, email delivery, owner authenticated dashboard data, responsive screenshot automation and deployment remain unverified; none is labelled complete.

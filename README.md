# APEX MOTO

APEX MOTO is a mobile-first Australian storefront for a small Melbourne seller of ORZ motocross helmets and goggles. It is designed for high-intent buyers arriving from Facebook Marketplace: recognise the product, check a size, see the real price and stock, add matching goggles, choose pickup or delivery, and order without creating an account.

The production catalogue uses the supplied APEX MOTO logo and real product images. It does not include fake reviews, customer numbers, sales timers, road-legality claims, or demonstration businesses and orders.

## Technology

- Next.js 16 App Router and React 19
- Strict TypeScript
- Tailwind CSS 4 plus a responsive project design system
- Lucide icons
- Stripe’s server SDK for hosted checkout and verified webhooks
- Neon Postgres for durable orders, shared-SKU stock reservations, events and email outbox
- Postmark-first transactional email with a verified Resend fallback and React Email templates
- Vitest for catalogue, stock, cart, business-scope, shipping, bundle, and checkout-policy tests
- Device-local storage only for non-sensitive cart identifiers and pending-order reconciliation
- Protected `/admin` order desk for fulfilment, stock, email status, pickup settings and guarded refunds

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS or Linux, use `cp .env.example .env.local`. Open [http://localhost:3000](http://localhost:3000).

The catalogue and cart work without credentials. Online payment fails closed until the database migration, signed Stripe webhook, email provider and application secrets are all configured. Follow `docs/PRODUCTION_SETUP.md`.

Run every project check with:

```bash
npm run verify
```

This runs lint, TypeScript, tests, the production build, and the production-content audit.

## Important files

- `src/config/site.ts` — APEX MOTO identity, contact links, pickup, shipping regions, goggle shipping, and policy switches
- `src/data/products.ts` — products, server-owned prices, photos, options, exact variants, stock, and bundle contents
- `src/config/size-guide.ts` — verified product-specific centimetre charts
- `src/config/navigation.ts` — desktop and mobile navigation
- `src/lib/products.ts` — catalogue validation and product calculations
- `src/lib/shipping.ts` — deterministic pickup, goggle-only, helmet-region, and quote-required rules
- `src/lib/checkout-policy.ts` — origin, business scope, item, stock, and delivery checks
- `src/app/api/checkout/route.ts` — server-owned Stripe Checkout creation
- `src/app/api/stripe/webhook/route.ts` — signed, idempotent payment/inventory/email/refund processing
- `db/migrations/0001_order_system.sql` — operational data model
- `src/app/admin` — private owner order desk
- `docs/ORDER_OPERATIONS.md` — daily fulfilment, cancellation, refund, stock and email procedures
- `LAUNCH_CHECKLIST.md` — the remaining real-world launch gates
- `QUICK_EDIT_GUIDE.md` — the shortest path for everyday edits

## Current catalogue

- ORZ Rally Helmet — Matte Black: $124.95
- ORZ Rally Helmet — Gloss White: $124.95
- ORZ MX Goggles: $25.00, in Black / Gold, Red / Gold, or Grey / Ice
- ORZ Helmet + Goggles Bundle: $144.95, with goggles priced at $20 and the helmet bag included free

The catalogue currently interprets the supplied stock message as:

- black: one each in S, M, L, and XL; XXL unavailable;
- white: Medium available with one unit; S, L, XL, and XXL unavailable;
- goggles: a conservative minimum of one in each photographed colour until the owner confirms the count.

Confirm the two inferred quantities in `LAUNCH_CHECKLIST.md` before enabling real payment.

## Add or replace product photos

1. Add the owned file under `public/products/<product-folder>/`.
2. Update the product’s `images` array in `src/data/products.ts`.
3. Enter the image’s actual width and height.
4. Add accurate alt text and a `colour` label when selecting that colour should switch the gallery image.
5. Run `npm run verify` and inspect the product page at a phone width.

Do not use another retailer’s imagery without permission.

## Add a product

1. Copy the closest product object in `src/data/products.ts`.
2. Give it a unique `id` and URL-safe `slug`.
3. Set its name, category, short copy, price in whole cents, and images.
4. Define every useful option and every valid option combination as a concrete variant.
5. Enter exact stock on each variant.
6. Add only specifications, box contents, and certification data supported for that exact item.
7. Add related product IDs and bundle components when relevant.
8. Run `npm run verify`.

Shop filters, product pages, metadata, sitemap entries, related products, and cart resolution derive from the catalogue automatically.

## Change price or stock

In `src/data/products.ts`, change `price` in whole cents. Catalogue `stock` seeds a new database SKU only once; after production setup, change physical counts in the owner order desk so adjustments are audited.

```ts
{ id: "black-l", options: { colour: "matte-black", size: "L" }, stock: 1 }
```

Stripe Checkout derives amounts from the validated server catalogue. Bundle combinations map to the same physical helmet and goggle SKUs as the separate listings, so paid orders and open reservations cannot oversell across product pages.

## Change colours or sizes

Edit the option values and the full variant list in `src/data/products.ts`. A displayed option is selectable only if a matching variant has stock. Colour names are always shown alongside swatches. Product images with a matching `colour` value automatically become the selected gallery image.

Edit verified centimetre rows only in `src/config/size-guide.ts` and only from information for the exact product.

## Change APEX MOTO details

Edit `src/config/site.ts`. Business name, tagline, email, phone, social URLs, pickup suburb, city, state, and reusable site copy are centralised there.

The current direct links are:

- Email: `max@apexmoto.com.au` (forwarded to the store Gmail inbox)
- Instagram: `https://www.instagram.com/apexmotostore.au/`
- Facebook: `https://www.facebook.com/share/19NopJFaeu/`

## Change shipping

Shipping configuration is in `src/config/site.ts`:

- `helmetShippingRegions` contains exact rates or quote-required estimates;
- `gogglesShippingPrice` is the flat goggles-only price;
- `maxIncludedGogglesWithHelmet` controls how many standalone goggles add no cost to a helmet shipment.

The cart chooses one method before checkout. The server recalculates it from catalogue items and configuration; it does not trust a browser-supplied amount. `regional-qld`, `regional-wa`, and helmet orders over the included-goggle limit stop before payment and direct the customer to request an exact quote.

## Configure orders, email and Stripe

Follow `docs/PRODUCTION_SETUP.md` in Stripe test mode first. Add Neon `DATABASE_URL`, run `npm run db:migrate`, verify the Postmark and Resend sending configuration, configure the five listed Stripe webhook events, and generate unrelated order/admin/cron secrets. Checkout refuses payment if any critical value is absent.

The signed Stripe webhook and the server-retrieved success-page fallback invoke the same transaction. The transaction verifies amount/currency, consumes reserved stock exactly once, records evidence and enqueues customer/owner confirmations. A redirect by itself never changes an order.

## Contact form

The email and social links always work as direct contact routes. To forward the web form, set an HTTPS `CONTACT_FORM_ENDPOINT`. The server validates business scope, lengths, email shape, topic, timing, and a honeypot. It refuses localhost, non-HTTPS targets, redirects, oversized bodies, and slow provider calls.

## Environment variables

Copy `.env.example` to `.env.local`. `.env*` is ignored except `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin and Stripe return URLs |
| `STRIPE_SECRET_KEY` | Checkout | Server-only Stripe API credential |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No in current UI | Reserved for future Stripe client features |
| `STRIPE_WEBHOOK_SECRET` | Webhooks | Verifies Stripe event signatures |
| `DATABASE_URL` | Checkout | Neon Postgres connection used for orders and inventory |
| `POSTMARK_SERVER_TOKEN` | Email | Primary Postmark transactional credential |
| `RESEND_API_KEY` | Email | Verified automatic fallback when Postmark rejects or cannot accept a send |
| `ORDER_EMAIL_FROM` | Checkout | Shared verified sender used by both providers |
| `STORE_ORDER_EMAIL` | Checkout | Owner new-order/cancellation recipient |
| `ORDER_ACCESS_SECRET` | Checkout | Signs private customer order links |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Owner desk | Protects `/admin` |
| `CRON_SECRET` | Email recovery | Protects the daily outbox backstop |
| `PICKUP_ADDRESS_PRIVATE` | Pickup email | Exact private address, never rendered publicly |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | No | Reserved opt-in switch; no provider loads by default |
| `CONTACT_FORM_ENDPOINT` | Form delivery | Optional HTTPS form-provider endpoint |

## Deploy with GitHub and Vercel

Current production:

- GitHub: `https://github.com/maxlhill204-lab/APEXMOTO`
- Storefront: `https://www.apexmoto.com.au`
- Vercel project: `https://vercel.com/maxlhill204-labs-projects/apexmoto`

1. Finish `LAUNCH_CHECKLIST.md` and run `npm run verify`.
2. Push the repository to GitHub without `.env.local` or any credential.
3. In Vercel, choose **Add New → Project**, import the repository, and keep the detected Next.js settings.
4. Add production environment variables in **Project Settings → Environment Variables**.
5. Deploy, add the custom domain in **Project Settings → Domains**, and follow Vercel’s DNS instructions.
6. Set `NEXT_PUBLIC_SITE_URL` to the canonical `https://` domain and redeploy.
7. Complete every database, email and Stripe step in `docs/PRODUCTION_SETUP.md`.
8. Complete deployed test pickup/delivery/cancellation/refund journeys before enabling live mode.

Restrict Vercel’s GitHub access to the intended repository, protect the production branch, and review every change to stock, prices, safety wording, checkout policy, and environment handling.

## Update after launch

1. Pull the latest code.
2. Change `src/config/site.ts`, `src/data/products.ts`, or an owned image.
3. Run `npm run verify`.
4. Commit and push.
5. Check the deployed product page and cart on a phone.
6. After a paid order, open `/admin`, verify email/fulfilment evidence, and move the order through the correct status.

## Troubleshooting

- **Checkout says temporarily unavailable:** at least one required database, webhook, email or signing value is absent; follow `docs/PRODUCTION_SETUP.md` rather than bypassing the gate.
- **A size or colour is disabled:** its exact variant stock is `0`, or no matching combination exists.
- **A catalogue edit fails the build:** read the validator error for duplicate IDs/slugs/combinations, invalid prices or stock, or incomplete verified certification.
- **A regional customer cannot pay:** regional Queensland and Western Australia intentionally require an exact address quote.
- **A goggle-heavy helmet cart needs a quote:** more than three standalone pairs with a helmet intentionally stops before payment.
- **The form will not send:** configure a valid HTTPS `CONTACT_FORM_ENDPOINT`; direct email and social links remain available.
- **The success page says unverified:** use the complete private return/status link. A Stripe session must map to the durable APEX MOTO order and exact amount.
- **A confirmation email failed:** inspect the bounded provider error in `/admin`, correct the Postmark/Resend configuration, then choose `Retry failed emails`. Automatic attempts use backoff and stop after eight; an explicit owner retry resets that job safely.

## Before taking real orders

Complete `LAUNCH_CHECKLIST.md`. In particular, confirm inferred physical counts, final policies, tracking and dispatch wording, legal identity where required, every safety claim, migrated database evidence, Stripe/webhook/email evidence, final-domain configuration, and real-device QA.

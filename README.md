# APEX MOTO

APEX MOTO is a mobile-first Australian storefront for a small Melbourne seller of ORZ motocross helmets and goggles. It is designed for high-intent buyers arriving from Facebook Marketplace: recognise the product, check a size, see the real price and stock, add matching goggles, choose pickup or delivery, and order without creating an account.

The production catalogue uses the supplied APEX MOTO logo and real product images. It does not include fake reviews, customer numbers, sales timers, road-legality claims, or demonstration businesses and orders.

## Technology

- Next.js 16 App Router and React 19
- Strict TypeScript
- Tailwind CSS 4 plus a responsive project design system
- Lucide icons
- Stripe’s server SDK for hosted checkout and verified webhooks
- Vitest for catalogue, stock, cart, business-scope, shipping, bundle, and checkout-policy tests
- Device-local storage for non-sensitive cart identifiers and quantities

Phase one intentionally has no customer accounts, database, admin dashboard, or automated inventory decrement.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS or Linux, use `cp .env.example .env.local`. Open [http://localhost:3000](http://localhost:3000).

The catalogue and cart work without credentials. Online payment remains safely unavailable until Stripe configuration is complete.

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
- `src/app/api/stripe/webhook/route.ts` — Stripe signature verification; no inventory mutation in phase one
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

In `src/data/products.ts`, change `price` in whole cents and `stock` on the exact variant.

```ts
{ id: "black-l", options: { colour: "matte-black", size: "L" }, stock: 1 }
```

Stripe Checkout derives its line-item amount from the validated server catalogue, so changing this field changes the next Checkout Session after deployment. Bundle combinations use the same physical stock and must be reconciled with component stock manually.

## Change colours or sizes

Edit the option values and the full variant list in `src/data/products.ts`. A displayed option is selectable only if a matching variant has stock. Colour names are always shown alongside swatches. Product images with a matching `colour` value automatically become the selected gallery image.

Edit verified centimetre rows only in `src/config/size-guide.ts` and only from information for the exact product.

## Change APEX MOTO details

Edit `src/config/site.ts`. Business name, tagline, email, phone, social URLs, pickup suburb, city, state, and reusable site copy are centralised there.

The current direct links are:

- Email: `apexmotostore.au@gmail.com`
- Instagram: `https://www.instagram.com/apexmotostore.au/`
- Facebook: `https://www.facebook.com/share/19NopJFaeu/`

## Change shipping

Shipping configuration is in `src/config/site.ts`:

- `helmetShippingRegions` contains exact rates or quote-required estimates;
- `gogglesShippingPrice` is the flat goggles-only price;
- `maxIncludedGogglesWithHelmet` controls how many standalone goggles add no cost to a helmet shipment.

The cart chooses one method before checkout. The server recalculates it from catalogue items and configuration; it does not trust a browser-supplied amount. `regional-qld`, `regional-wa`, and helmet orders over the included-goggle limit stop before payment and direct the customer to request an exact quote.

## Configure Stripe

Start in Stripe test mode.

1. Use a Stripe test-mode server credential first. A restricted key with only the required Checkout permissions is preferred where supported.
2. Put credentials in `.env.local`, never in source:

   ```text
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Forward test webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Put the printed test webhook secret in `.env.local` and restart the development server.
5. Test pickup, each exact delivery region, a quote-only region, an out-of-stock variant, cancelled checkout, successful payment, invalid signatures, and direct navigation to `/order-success`.

Checkout requires same-origin requests, the configured `businessId`, valid catalogue items, available stock, a server-known fulfilment method, a server-known delivery price, and an idempotency key. Product and shipping amounts are derived on the server; browser prices are ignored.

Stripe redirects do not change stock. A signature-verified webhook is payment evidence, but phase one still requires manual stock reconciliation.

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
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | No | Reserved opt-in switch; no provider loads by default |
| `CONTACT_FORM_ENDPOINT` | Form delivery | Optional HTTPS form-provider endpoint |

## Deploy with GitHub and Vercel

Current production:

- GitHub: `https://github.com/maxlhill204-lab/APEXMOTO`
- Vercel: `https://apexmoto.vercel.app`

1. Finish `LAUNCH_CHECKLIST.md` and run `npm run verify`.
2. Push the repository to GitHub without `.env.local` or any credential.
3. In Vercel, choose **Add New → Project**, import the repository, and keep the detected Next.js settings.
4. Add production environment variables in **Project Settings → Environment Variables**.
5. Deploy, add the custom domain in **Project Settings → Domains**, and follow Vercel’s DNS instructions.
6. Set `NEXT_PUBLIC_SITE_URL` to the canonical `https://` domain and redeploy.
7. Add `https://YOUR-DOMAIN/api/stripe/webhook` in Stripe and store its signing secret in Vercel.
8. Complete one deployed Stripe test-mode order before enabling live mode.

Restrict Vercel’s GitHub access to the intended repository, protect the production branch, and review every change to stock, prices, safety wording, checkout policy, and environment handling.

## Update after launch

1. Pull the latest code.
2. Change `src/config/site.ts`, `src/data/products.ts`, or an owned image.
3. Run `npm run verify`.
4. Commit and push.
5. Check the deployed product page and cart on a phone.
6. After a paid order, update repository stock immediately until database-backed inventory is added.

## Troubleshooting

- **Online payment is being connected:** rotate any exposed key, then add a fresh Stripe server credential through protected local and Vercel environment settings.
- **A size or colour is disabled:** its exact variant stock is `0`, or no matching combination exists.
- **A catalogue edit fails the build:** read the validator error for duplicate IDs/slugs/combinations, invalid prices or stock, or incomplete verified certification.
- **A regional customer cannot pay:** regional Queensland and Western Australia intentionally require an exact address quote.
- **A goggle-heavy helmet cart needs a quote:** more than three standalone pairs with a helmet intentionally stops before payment.
- **The form will not send:** configure a valid HTTPS `CONTACT_FORM_ENDPOINT`; direct email and social links remain available.
- **The success page says unverified:** only a valid paid Stripe Checkout session for the APEX MOTO `businessId` is accepted.

## Before taking real orders

Complete `LAUNCH_CHECKLIST.md`. In particular, confirm inferred inventory, final policies, tracking and dispatch wording, legal identity where required, every safety claim, Stripe test evidence, webhook evidence, final-domain configuration, real-device QA, and the manual stock-reconciliation routine.

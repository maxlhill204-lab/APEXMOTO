# APEX MOTO launch checklist

Do not accept real payment until every required item has real evidence.

## Brand and contact

- [x] Use the supplied APEX MOTO name and logo.
- [x] Add the supplied email, Instagram, and Facebook links.
- [x] Set Newport / Melbourne pickup without publishing a private address.
- [x] Use `https://apexmoto.vercel.app` as the current canonical HTTPS production origin.
- [ ] Attach a custom domain later if desired, then update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Products and stock

- [x] Add the supplied black helmet, white helmet, three goggles, product sheet, and helmet-bag images.
- [x] Keep helmet pricing at $124.95 and set goggles to $25 alone / $20 in the bundle.
- [x] Set matte-black helmet stock to one each in S, M, L, and XL; XXL is unavailable.
- [x] Set white S, L, and XL to sold out.
- [ ] Confirm the inferred white Medium quantity of one and whether white XXL should remain unavailable.
- [ ] Count each goggle colour; the catalogue currently uses the conservative minimum of one each because exact quantities were not supplied.
- [ ] Recount physical stock immediately before online payment opens.
- [x] Map bundle variants to the same physical helmet and goggle SKUs as individual products.
- [ ] Provision/migrate Neon and verify the owner dashboard physical counts against a real recount.

## Product information and safety

- [x] Transcribe the supplied ORZ size chart: S 53–54, M 55–56, L 57–58, XL 59–60, XXL 61–62 cm.
- [x] Transcribe the supplied ABS material and approximate 1080 g weight.
- [x] Record the visible rear DOT FMVSS No. 218 marking without claiming Australian road legality.
- [ ] Obtain and retain separate certification documentation if the DOT statement will be used beyond the visible product marking.
- [ ] Confirm the helmet bag is included with every bundle as currently listed.

## Delivery and policies

- [x] Enter the supplied metro, Tasmania, and Northern Territory helmet rates.
- [x] Enter $8 goggles-only delivery and no extra charge for up to three standalone goggles travelling with a helmet.
- [x] Require an exact quote for regional Queensland, regional Western Australia, and helmet orders with more than three standalone goggles.
- [ ] Confirm dispatch timing and whether tracking is always provided.
- [ ] Confirm change-of-mind and sizing-exchange terms.
- [ ] Add legal entity and ABN details only if accurate and required.
- [ ] Review privacy, returns, and terms against actual operating practices.

## Durable orders, email and Stripe test mode

- [x] Create matching one-time test products and prices in the connected APEX WEB sandbox as provider evidence.
- [x] Derive Checkout line-item prices from the validated server catalogue so browser amounts are never trusted.
- [ ] Rotate the Stripe secret that was exposed in chat before using any replacement credential.
- [ ] Add Neon `DATABASE_URL`, run `npm run db:migrate`, and verify `/admin` can read the empty/real order state.
- [ ] Verify an owned sender domain in Resend and configure `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, and `STORE_ORDER_EMAIL`.
- [ ] Configure independent `ORDER_ACCESS_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`, and private pickup address as documented.
- [ ] Add a fresh restricted or secret server credential and the endpoint-specific `STRIPE_WEBHOOK_SECRET` locally and in Vercel; never commit them.
- [ ] Configure the five events listed in `docs/PRODUCTION_SETUP.md` on the correct test/live endpoint.
- [ ] Test successful, cancelled, and failed checkout paths.
- [ ] Confirm pickup and every exact delivery rate inside hosted checkout.
- [ ] Confirm regional quote-only options cannot proceed to payment.
- [ ] Confirm a bad webhook signature is rejected and direct `/order-success` navigation is not treated as an order.
- [ ] Verify paid stock decrements exactly once, bundles share component stock, expiration releases reservations, and a webhook replay produces no duplicate effect.
- [ ] Verify customer and owner confirmation emails, failed-email retry, private order status, cancellation acknowledgement and confirmed refund email.

## Deployment and final customer journey

- [x] Run `npm run verify` with no failures.
- [x] Push to GitHub without `.env.local` or credentials.
- [x] Deploy GitHub `main` to Vercel production at `https://apexmoto.vercel.app`.
- [ ] Complete every environment/provider gate in `docs/PRODUCTION_SETUP.md`, then redeploy.
- [ ] Test 320, 375, 390, 430, 768, 1024, and 1440 pixel layouts on the deployed site.
- [ ] Test on a real iPhone/Safari plus current Chrome, Edge, and Firefox.
- [ ] Open the black-helmet link from a Marketplace message and confirm price, size L, pickup, goggles, and add-to-cart are obvious.
- [ ] Place one complete Stripe test-mode order on the deployed site.
- [ ] Confirm the test order displays name, email, items, variants, quantities, total, address/pickup and email state in `/admin`.
- [ ] Recheck every public product claim and stock count immediately before live mode.

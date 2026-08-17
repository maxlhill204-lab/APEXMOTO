# APEX MOTO launch checklist

Do not accept real payment until every required item has real evidence.

## Brand and contact

- [x] Use the supplied APEX MOTO name and logo.
- [x] Add the supplied email, Instagram, and Facebook links.
- [x] Set Newport / Melbourne pickup without publishing a private address.
- [ ] Choose the final domain and set `NEXT_PUBLIC_SITE_URL` to its HTTPS origin.

## Products and stock

- [x] Add the supplied black helmet, white helmet, three goggles, product sheet, and helmet-bag images.
- [x] Keep helmet pricing at $124.95 and set goggles to $25 alone / $20 in the bundle.
- [x] Set matte-black helmet stock to one each in S, M, L, and XL; XXL is unavailable.
- [x] Set white S, L, and XL to sold out.
- [ ] Confirm the inferred white Medium quantity of one and whether white XXL should remain unavailable.
- [ ] Count each goggle colour; the catalogue currently uses the conservative minimum of one each because exact quantities were not supplied.
- [ ] Recount physical stock immediately before online payment opens.
- [ ] Keep bundle stock aligned with the same physical helmet and goggle inventory.

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

## Stripe test mode

- [x] Create matching one-time test products and prices in the connected APEX WEB sandbox as provider evidence.
- [x] Derive Checkout line-item prices from the validated server catalogue so browser amounts are never trusted.
- [ ] Rotate the Stripe secret that was exposed in chat before using any replacement credential.
- [ ] Add a fresh restricted or secret server credential and `STRIPE_WEBHOOK_SECRET` locally and in Vercel; never commit them.
- [ ] Configure the production webhook endpoint.
- [ ] Test successful, cancelled, and failed checkout paths.
- [ ] Confirm pickup and every exact delivery rate inside hosted checkout.
- [ ] Confirm regional quote-only options cannot proceed to payment.
- [ ] Confirm a bad webhook signature is rejected and direct `/order-success` navigation is not treated as an order.
- [ ] Document the manual process for reducing repository stock after each paid order.

## Deployment and final customer journey

- [ ] Run `npm run verify` with no failures.
- [ ] Push to GitHub without `.env.local` or credentials.
- [ ] Deploy to Vercel, add environment variables, attach the final domain, and redeploy with the final site URL.
- [ ] Test 320, 375, 390, 430, 768, 1024, and 1440 pixel layouts on the deployed site.
- [ ] Test on a real iPhone/Safari plus current Chrome, Edge, and Firefox.
- [ ] Open the black-helmet link from a Marketplace message and confirm price, size L, pickup, goggles, and add-to-cart are obvious.
- [ ] Place one complete Stripe test-mode order on the deployed site.
- [ ] Recheck every public product claim and stock count immediately before live mode.

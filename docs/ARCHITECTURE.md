# Architecture

## Rendering boundary

Next.js App Router server components render pages, metadata, private order status and the owner desk by default. Client components are limited to shop filters, image galleries, option selection, drawers, the contact form, analytics events, and the device-local cart. Server-only modules own database, Stripe, email and administrative operations.

## Catalogue boundary

`src/data/products.ts` is the product and price source of truth. `src/lib/products.ts` validates it during import and build. Every sellable variant maps to physical inventory requirements; bundles and individual listings therefore compete for the same database-backed helmet and goggle SKUs.

## Business scope

Every product and cart request carries `businessId`. Client storage is sanitised against the configured business and server catalogue. Checkout denies mismatched scope. Every order, item, inventory, reservation, event, email, cancellation and administrative query includes `businessId`; private order tokens also bind business, order ID and normalized email.

## Commerce boundary

Cart storage contains only business/product/variant IDs and quantities. A temporary pending-checkout marker additionally contains an opaque order-access token and purchased cart keys, never payment details. `POST /api/checkout` validates origin, scope, confirmation details and fulfilment, then atomically creates an order and reserves the physical SKUs before opening Stripe. The browser UUID is unique in Postgres and becomes the namespaced Stripe idempotency key.

## Fulfilment boundary

The browser sends only a fulfilment method ID. `src/lib/shipping.ts` combines it with resolved catalogue items and server configuration:

- pickup is free;
- goggles-only delivery is the configured Australia-wide flat price;
- a helmet or bundle uses the configured destination price;
- up to three standalone goggles add no cost to a helmet shipment;
- regional ranges and larger goggle quantities return `SHIPPING_QUOTE_REQUIRED` and cannot enter payment.

Stripe receives only the single server-approved method and exact amount.

## Order, inventory and email boundary

Neon Postgres is the durable operational source of truth. A transaction locks each sorted physical SKU and rejects checkout when stock minus active reservations is insufficient. Signed paid events re-retrieve the Checkout Session, verify the order, currency, and `subtotal + shipping − Stripe discount = amount paid`; record promotion evidence; consume the reservation and decrement stock exactly once; append order/inventory evidence; and enqueue customer/owner email jobs. Expiration or payment failure releases the reservation.

The Stripe webhook is authoritative. The success page retrieves Stripe server-side and invokes the same idempotent fulfilment transaction as a latency fallback, but never trusts the redirect. Stripe is also given the confirmed customer email as `receipt_email` so live payments receive a provider receipt independently of the custom order email. Email jobs are unique in Postgres; Postmark is primary and the verified Resend sender is the automatic fallback with deterministic provider idempotency. Due-time checks, an eight-attempt backoff bound, the protected daily backstop and an authenticated owner reset prevent hot loops while preserving recovery.

## Owner boundary

`/admin` uses an HMAC-signed, short-lived, HttpOnly, SameSite=Strict cookie. Password comparison is timing-safe; failed login attempts are business-scoped and rate-limited. Authenticated Server Actions provide explicit fulfilment transitions, audited stock adjustment, failed-email retry, pickup/support settings, and order-number-confirmed full Stripe refunds.

## Contact boundary

The contact API validates scope, types, lengths, topic, elapsed time, and a honeypot. It forwards only to an explicitly configured HTTPS endpoint with a timeout and no redirects. Without configuration it reports `NOT_CONFIGURED`; direct email and social routes remain visible.

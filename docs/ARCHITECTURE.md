# Architecture

## Rendering boundary

Next.js App Router server components render pages and metadata by default. Client components are limited to shop filters, image galleries, option selection, drawers, the contact form, analytics events, and the device-local cart.

## Catalogue boundary

`src/data/products.ts` is the phase-one source of truth. `src/lib/products.ts` validates it during import and build. Product pages, shop filters, metadata, sitemap, related products, bundle calculations, gallery colour matching, and cart resolution derive from that catalogue.

## Business scope

Every product and cart request carries `businessId`. Client storage is sanitised against the configured business and server catalogue. Checkout denies mismatched scope. There is one configured business in phase one; the explicit boundary prevents accidental cross-business reuse if the code is extended.

## Commerce boundary

Cart storage contains only business, product, variant IDs, and quantities. The server resolves the product, stock, and catalogue price. `POST /api/checkout` runs deterministic origin, scope, input, stock, and shipping checks before any external call, then creates Stripe line-item price data from the validated catalogue. A browser-generated UUID becomes the namespaced Stripe idempotency key.

## Fulfilment boundary

The browser sends only a fulfilment method ID. `src/lib/shipping.ts` combines it with resolved catalogue items and server configuration:

- pickup is free;
- goggles-only delivery is the configured Australia-wide flat price;
- a helmet or bundle uses the configured destination price;
- up to three standalone goggles add no cost to a helmet shipment;
- regional ranges and larger goggle quantities return `SHIPPING_QUOTE_REQUIRED` and cannot enter payment.

Stripe receives only the single server-approved method and exact amount.

## Order and inventory boundary

Stripe webhook signatures are verified, but phase one has no order database and does not mutate stock. Repository stock must be reconciled manually. Database-backed inventory needs atomic reservations, bounded retries, explicit states, migrations, and audit evidence before automated decrement or higher sales volume.

## Contact boundary

The contact API validates scope, types, lengths, topic, elapsed time, and a honeypot. It forwards only to an explicitly configured HTTPS endpoint with a timeout and no redirects. Without configuration it reports `NOT_CONFIGURED`; direct email and social routes remain visible.

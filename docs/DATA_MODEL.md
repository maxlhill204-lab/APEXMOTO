# Data model

## Product

A product belongs to one `businessId` and has a unique `id` and `slug`, category, supported descriptions, price in whole cents, image records, option definitions, and concrete variants. Optional features, specifications, box contents, certification evidence, SEO copy, related products, and bundle components render only when configured.

## Variant

Every variant has a unique `id`, exactly one value for every product option, and a non-negative integer `stock`. Stock is never inferred from a product-wide boolean. Checkout resolves the parent product price from the server catalogue after the exact variant is validated.

## Product image

Each image has a public source, factual alt text, real dimensions, and an optional colour label. A matching option label switches the gallery to that image. The bundle lead visual is assembled in the UI from the supplied helmet, goggles, and bag files without changing the underlying catalogue evidence.

## Certification

Certification contains an optional standard, approval number, verification state, and documentation URL. A `verified: true` record without a standard fails catalogue validation. The ORZ record is based on the owner statement and visible rear product label; customer-facing wording explicitly avoids treating that marking as proof of Australian road legality.

## Cart item

`{ businessId, productId, variantId, quantity }`. No browser price, shipping price, product copy, personal information, or secret is stored. Resolution against the server catalogue produces display data and line totals.

## Fulfilment selection

`shippingMethodId` identifies pickup, goggles-only Australia-wide delivery, or a configured helmet destination. It never contains a price. `calculateShipping` combines the selected method with resolved items and returns either one exact server amount or a quote-required state.

## Size chart

Product-specific chart with manufacturer, verification flag, and centimetre rows. The ORZ Rally chart is transcribed from the owner-supplied product sheet and applies to the listed colour variants of that helmet.

## Future migration

When inventory moves to a database, add migrations for businesses, products, variants, inventory movements and reservations, orders, shipping quotes, and idempotency records. Scope every query by `businessId`, use atomic stock changes, keep append-only audit evidence, and add cross-business authorisation tests.
